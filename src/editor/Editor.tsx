/**
 * Оболочка визуального редактора студии (Фаза 1, M1).
 * React + Puck — это редактор; выходной render остаётся агностичным: холст рисует
 * блоки нашим mod.render (через BlockPreview), а не вторым путём (ADR-0002).
 * Стартовый документ — examples/landing.sample.json (как в превью Фазы 0).
 */
import { useMemo, useRef, useState } from 'react';
import { Puck } from '@measured/puck';
import type { Data } from '@measured/puck';
import '@measured/puck/puck.css';

import landingSample from '../../examples/landing.sample.json';
import type { StudioDocument } from '../render-core/document';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { DocumentActions } from './document-actions';
import { EditorDocContext } from './editor-doc';
import { InlineEditBridge } from './inline-edit';
import { documentToPuck, makeConfig, puckToDocument } from './puck-adapter';
import { SectionScriptsBridge } from './section-scripts';
import { themeCssById } from './theme-assets';
import { ThemeSwitcher } from './theme-switcher';

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

    // CSS темы холста — по ThemeRef.id текущего документа (перерисовывается при смене).
    const themeCss = themeCssById(ctxDoc.theme.id);

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
                            <ThemeSwitcher
                                value={ctxDoc.theme.id}
                                onChange={handleThemeChange}
                            />
                            <DocumentActions
                                getDoc={() => docRef.current}
                                onLoad={handleLoad}
                            />
                            {children}
                        </>
                    ),
                    // Мост inline-правки монтируется внутри Puck-стора — отсюда у него
                    // есть dispatch. overrides.puck оборачивает весь UI редактора,
                    // не переписывая раскладку (ось «владение UX» — отдельная задача).
                    puck: ({ children }) => (
                        <InlineEditBridge>
                            <SectionScriptsBridge>{children}</SectionScriptsBridge>
                        </InlineEditBridge>
                    ),
                }}
            />
        </EditorDocContext.Provider>
    );
}
