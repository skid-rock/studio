/**
 * Оболочка визуального редактора студии (Фаза 1, M1).
 * React + Puck — это редактор; выходной render остаётся агностичным: холст рисует
 * блоки нашим mod.render (через BlockPreview), а не вторым путём (ADR-0002).
 * Стартовый документ — examples/landing.sample.json (как в превью Фазы 0).
 */
import { useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Puck } from '@measured/puck';
import type { Data } from '@measured/puck';
import '@measured/puck/puck.css';

import landingSample from '../../examples/landing.sample.json';
import type { StudioDocument } from '../render-core/document';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { DocumentActions } from './document-actions';
import { buildExportHtml, downloadHtml, formatBytes } from './export-html';
import { EditorDocContext } from './editor-doc';
import { InlineEditBridge } from './inline-edit';
import { documentToPuck, makeConfig, puckToDocument } from './puck-adapter';
import { SectionScriptsBridge } from './section-scripts';
import { resolveThemeCss, themeCssById } from './theme-assets';
import { ThemeSwitcher } from './theme-switcher';
import { ThemeOverrides } from './theme-overrides';
import { UndoRedo } from './undo-redo';

import baseCss from '../render-core/styles/base.css?raw';
import fontsCss from '../render-core/styles/fonts.css?raw';

/** Стартовый документ редактора — демо-лендинг Фазы 0 (конверт + hero + closing). */
const INITIAL_DOC: StudioDocument = parseDocument(landingSample);

/** CSS базы холста (тема подключается динамически по ThemeRef.id). */
const FRAME_BASE_CSS = [baseCss, fontsCss].join('\n');
// CSS всех модулей реестра (list() уже уникален по type, доп.дедуп не нужен).
const MODULES_CSS = defaultRegistry
    .list()
    .map((m) => m.css ?? '')
    .join('\n');

/**
 * Режим холста: конверт в проде — полноэкранный fixed-оверлей; в холсте редактора
 * нейтрализуем его в обычный блок фиксированной высоты (иначе перекрыл бы весь
 * редактор). Честный «режим холста» для full-bleed секций — задача Фазы 1
 * (см. ADR-0004); здесь минимальная нейтрализация.
 */
const CANVAS_CSS = `
.editor-block[data-block="intro/envelope"] {
  position: relative;
  height: 70vh;
  max-height: 560px;
  overflow: hidden;
}
.editor-block[data-block="intro/envelope"] .envelope-overlay {
  position: absolute;
}
`;

/**
 * Оверрайд Puck.puck — обёртка всего UI редактора edit-time-мостами. Вынесен на
 * уровень модуля СОЗНАТЕЛЬНО: Puck читает overrides.puck как тип компонента
 * (`CustomPuck = overrides.puck`) и при смене его ссылки размонтирует/перемонтирует
 * весь UI, включая поля боковой панели — из-за этого фокус слетал после каждого
 * введённого символа. Стабильная ссылка (модульный компонент, не inline-стрелка)
 * убирает ремоунт. Мосты зависят только от children, состояние Editor им не нужно.
 */
function PuckOverride({ children }: { children: ReactNode }): ReactElement {
    return (
        <InlineEditBridge>
            <SectionScriptsBridge>{children}</SectionScriptsBridge>
        </InlineEditBridge>
    );
}

export function Editor() {
    // Живой документ для пересчёта order держим в ref (база round-trip).
    const docRef = useRef<StudioDocument>(INITIAL_DOC);
    const [data, setData] = useState<Data>(() => documentToPuck(INITIAL_DOC));

    // revision — ключ ремоунта Puck: смена форсит свежий маунт со свежими data
    // (используется при загрузке документа, чтобы холст пересобрался с нуля).
    const [revision, setRevision] = useState(0);

    // Значение контекста рендера — документ, СТАБИЛЬНЫЙ по глобальным полям
    // (тема/motion/версия). Правка props секции не меняет ссылку → превью соседних
    // секций не перерисовываются (точечный ре-рендер, challenges §6). Секции на MVP
    // читают из ctx только глобальное (фактически — ничего), поэтому «заморозка»
    // sections безопасна. Если блок начнёт читать ctx.doc.sections — пересмотреть
    // (семя для STUDIO-014).
    const [ctxDoc, setCtxDoc] = useState<StudioDocument>(INITIAL_DOC);

    const config = useMemo(() => makeConfig(defaultRegistry), []);

    // CSS темы холста — по ThemeRef (id + оверрайды) текущего документа.
    const themeCss = resolveThemeCss(ctxDoc.theme);

    function handleChange(next: Data) {
        setData(next);
        const nextDoc = puckToDocument(next, docRef.current, defaultRegistry);
        docRef.current = nextDoc;
        // Контекст обновляем ТОЛЬКО при смене глобальных полей: иначе вернётся прежняя
        // ссылка (cur) и провайдер не разбудит потребителей (bail-out по Object.is).
        setCtxDoc((cur) =>
            cur.theme === nextDoc.theme &&
            cur.motion === nextDoc.motion &&
            cur.schemaVersion === nextDoc.schemaVersion
                ? cur
                : nextDoc,
        );
    }

    /** Применить загруженный документ: сброс живого состояния и ремоунт холста. */
    function handleLoad(loaded: StudioDocument) {
        docRef.current = loaded;
        setData(documentToPuck(loaded));
        setCtxDoc(loaded); // тема/motion могли смениться → обновить контекст рендера
        setRevision((r) => r + 1);
    }

    /** Сменить тему документа: правит ThemeRef.id → новый ctx перекрашивает холст. */
    function handleThemeChange(id: string) {
        const nextDoc: StudioDocument = {
            ...docRef.current,
            theme: { ...docRef.current.theme, id },
        };
        docRef.current = nextDoc;
        setCtxDoc(nextDoc);
    }

    /** Собрать index.html текущего документа, замерить вес, скачать. */
    function handleExport() {
        const { html, bytes, withinBudget } = buildExportHtml(
            docRef.current,
            defaultRegistry,
            { baseCss: FRAME_BASE_CSS, themeCss },
        );
        downloadHtml(html);
        // Отчёт о весе: бюджет — самостоятельный index.html без внешних картинок/шрифтов.
        const status = withinBudget ? 'в бюджете' : 'ПРЕВЫШЕН бюджет';
        console.info(`Экспорт: ${formatBytes(bytes)} (${status})`);
        alert(
            `Экспортирован index.html\nВес: ${formatBytes(bytes)} — ${status}\n` +
                `(картинки и шрифты подключаются ссылками и в этот вес не входят)`,
        );
    }

    /** Изменить точечный оверрайд токена темы ('' — снять оверрайд). */
    function handleOverrideChange(key: string, value: string) {
        const prev = docRef.current.theme.overrides ?? {};
        const overrides = { ...prev };

        if (value) {
            overrides[key] = value;
        } else {
            delete overrides[key];
        }

        const nextDoc: StudioDocument = {
            ...docRef.current,
            theme: { ...docRef.current.theme, overrides },
        };
        docRef.current = nextDoc;
        setCtxDoc(nextDoc); // смена theme → новый ctx перекрашивает холст
    }

    return (
        <EditorDocContext.Provider value={ctxDoc}>
            <style>{FRAME_BASE_CSS}</style>
            <style>{themeCss}</style>
            <style>{MODULES_CSS}</style>
            <style>{CANVAS_CSS}</style>
            <Puck
                key={revision}
                config={config}
                data={data}
                onChange={handleChange}
                iframe={{ enabled: false }}
                overrides={{
                    headerActions: ({ children }) => (
                        <>
                            <UndoRedo />
                            <ThemeSwitcher
                                value={ctxDoc.theme.id}
                                onChange={handleThemeChange}
                            />
                            <ThemeOverrides
                                value={ctxDoc.theme.overrides}
                                presetCss={themeCssById(ctxDoc.theme.id)}
                                onChange={handleOverrideChange}
                            />
                            <DocumentActions
                                getDoc={() => docRef.current}
                                onLoad={handleLoad}
                                onExport={handleExport}
                            />
                            {children}
                        </>
                    ),
                    // Мост inline-правки монтируется внутри Puck-стора — отсюда у него
                    // есть dispatch. overrides.puck оборачивает весь UI редактора,
                    // не переписывая раскладку (ось «владение UX» — отдельная задача).
                    // Ссылка стабильна (модульный PuckOverride) — иначе Puck ремоунтит
                    // весь UI на каждый ре-рендер и фокус полей панели слетает.
                    puck: PuckOverride,
                }}
            />
        </EditorDocContext.Provider>
    );
}
