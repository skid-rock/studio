/**
 * СПАЙК (STUDIO-008) — мини-редактор на Craft.js поверх нашей модели/render.
 * Зеркало spikes/editor/App.tsx (Puck), но каркас редактора собран руками:
 *
 *  - палитра (Toolbox) + DnD Craft добавляют/переставляют наши секции;
 *  - панель свойств (SettingsColumn → related.settings) строится из ParamSchema;
 *  - холст (<Frame>) рисует блок нашим агностичным mod.render (без второго рендера);
 *  - кнопка «Экспорт» гонит текущее состояние через renderDocument — строка
 *    HTML без React (тот же путь, что в Node-экспорте STUDIO-009).
 *
 * Это одноразовый спайк: НЕ в src/, в прод-сборку не входит.
 */
import { createElement, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Editor, Frame, useEditor } from '@craftjs/core';

import type { StudioDocument } from '../../src/render-core/document';
import { renderDocument } from '../../src/render-core/render';
import { defaultRegistry } from '../../src/sections/registry.default';
import {
    craftToDocument,
    documentToCraft,
    makeResolver,
} from './craft-adapter';
import { Toolbox } from './Toolbox';

import baseCss from '../../src/render-core/styles/base.css?raw';
import fontsCss from '../../src/render-core/styles/fonts.css?raw';
import creamNavyCss from '../../src/tokens/dist/cream-navy.css?raw';

/** Стартовый документ спайка: конверт + hero + closing (есть что переставлять). */
const INITIAL_DOC: StudioDocument = {
    schemaVersion: 1,
    theme: { id: 'cream-navy' },
    motion: { preset: 'subtle' },
    sections: [
        { id: 's_intro', type: 'intro/envelope', order: 'a0', props: {} },
        {
            id: 's_hero',
            type: 'hero',
            order: 'a1',
            props: {
                eyebrow: 'Мы женимся',
                names: 'Полина & Илья',
                date: '05.08.2026',
            },
        },
        {
            id: 's_closing',
            type: 'closing',
            order: 'a2',
            props: {
                signature: 'С любовью, Полина & Илья',
                ps: 'Будем рады видеть вас!',
            },
        },
    ],
};

/** CSS темы/базы для холста превью (как в src/App.tsx — через ?raw). */
const FRAME_CSS = [baseCss, fontsCss, creamNavyCss].join('\n');

/**
 * Локальный CSS спайка: каркас 3 колонок + нейтрализация полноэкранного конверта
 * в холсте (как .spike-block в Puck-спайке), подсветка выделения, панель и палитра.
 */
const SPIKE_CSS = `
.cf-app {
  display: grid;
  grid-template-columns: 200px 1fr 320px;
  gap: 0;
  height: 100vh;
  font: 14px/1.4 system-ui, sans-serif;
}
.cf-col { overflow: auto; }
.cf-col-left { background: #0d1b2a; color: #cfe3ff; padding: 12px; }
.cf-col-canvas { background: #e9eef4; padding: 16px; }
.cf-col-right { background: #f4f6f8; border-left: 1px solid #d4dae1; padding: 12px; }

.cf-toolbox { display: flex; flex-direction: column; gap: 8px; }
.cf-toolbox-item {
  padding: 10px; border-radius: 8px; border: 1px dashed #4a6b8a;
  background: #16273a; color: #cfe3ff; cursor: grab; text-align: left; font: inherit;
}
.cf-toolbox-item:active { cursor: grabbing; }

.cf-group { margin-bottom: 16px; }
.cf-group-title { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; }
.cf-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.cf-label { display: flex; justify-content: space-between; font-size: 12px; }
.cf-val { opacity: .7; font-variant-numeric: tabular-nums; }
.cf-row input[type="range"] { width: 100%; }
.cf-row textarea, .cf-row select { width: 100%; font: inherit; padding: 4px; box-sizing: border-box; }
.cf-empty { opacity: .6; font-size: 13px; }
.cf-selected-name { font-weight: 600; margin: 0 0 12px; }

/* Холст: каждый блок — кликабельный/перетаскиваемый узел */
.craft-block { position: relative; outline: 2px solid transparent; transition: outline-color .12s; }
.craft-block.is-selected { outline-color: #275889; }
.craft-block:hover { outline-color: #9bbbd8; }

/* Конверт в проде — полноэкранный fixed; в холсте делаем обычным блоком */
.craft-block[data-block="intro/envelope"] {
  height: 70vh;
  max-height: 560px;
  overflow: hidden;
}
.craft-block[data-block="intro/envelope"] .envelope-overlay { position: absolute; }

.cf-export {
  position: fixed; right: 16px; bottom: 16px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
}
.cf-export button {
  padding: 8px 14px; border-radius: 8px; border: 1px solid #275889;
  background: #275889; color: #fff; cursor: pointer; font: 14px/1.2 system-ui, sans-serif;
}
.cf-export pre {
  max-width: 420px; max-height: 240px; overflow: auto; margin: 0; padding: 10px;
  border-radius: 8px; background: #0d1b2a; color: #cfe3ff;
  font: 11px/1.4 ui-monospace, monospace; white-space: pre-wrap; word-break: break-all;
}
`;

/**
 * Колонка свойств: находит выделенный узел и рендерит его related.settings
 * (панель из ParamSchema). Это идиоматичный для Craft способ «панели свойств».
 */
function SettingsColumn(): ReactElement {
    const { selectedName, Settings } = useEditor((state) => {
        const id = [...state.events.selected][0] as string | undefined;
        const node = id ? state.nodes[id] : undefined;
        return {
            selectedName: node?.data.displayName,
            Settings: node?.related?.settings,
        };
    });

    if (!Settings) {
        return createElement(
            'p',
            { className: 'cf-empty' },
            'Выберите блок в холсте, чтобы изменить его свойства.',
        );
    }
    return createElement(
        'div',
        null,
        createElement('p', { className: 'cf-selected-name' }, selectedName),
        createElement(Settings),
    );
}

/** Кнопка экспорта: читает текущее состояние Craft и гонит его через renderDocument. */
function ExportBar(): ReactElement {
    const { query } = useEditor();
    const [exported, setExported] = useState<string | null>(null);

    function handleExport(): void {
        const doc = craftToDocument(
            query.getSerializedNodes() as Record<
                string,
                Record<string, unknown>
            >,
            INITIAL_DOC,
        );
        const { html, css } = renderDocument(doc, {
            registry: defaultRegistry,
        });
        const hasReact = /data-reactroot|__reactProps|reactFiber|<script/i.test(
            html,
        );
        setExported(
            `// секций: ${doc.sections.length} · React в выводе: ${hasReact ? 'ДА (ошибка!)' : 'нет'}\n` +
                `// html: ${html.length} байт · css: ${css.length} байт\n\n` +
                html.slice(0, 900) +
                (html.length > 900 ? '\n…' : ''),
        );
    }

    return createElement(
        'div',
        { className: 'cf-export' },
        exported && createElement('pre', null, exported),
        createElement(
            'button',
            { type: 'button', onClick: handleExport },
            'Экспорт (агностичный renderDocument)',
        ),
    );
}

export function App(): ReactElement {
    // Документ держим в ref — обёртки блоков читают актуальный doc для RenderContext.
    const docRef = useRef<StudioDocument>(INITIAL_DOC);
    const initialNodes = useMemo(() => documentToCraft(INITIAL_DOC), []);
    const resolver = useMemo(
        () => makeResolver(defaultRegistry, () => docRef.current),
        [],
    );

    // Синхронизируем документ при любых изменениях дерева (DnD, правки, add/remove).
    function handleNodesChange(query: {
        getSerializedNodes: () => unknown;
    }): void {
        docRef.current = craftToDocument(
            query.getSerializedNodes() as Record<
                string,
                Record<string, unknown>
            >,
            INITIAL_DOC,
        );
    }

    return createElement(
        'div',
        null,
        createElement('style', null, FRAME_CSS),
        createElement('style', null, SPIKE_CSS),
        createElement(
            Editor,
            { resolver, onNodesChange: handleNodesChange as never },
            createElement(
                'div',
                { className: 'cf-app' },
                createElement(
                    'aside',
                    { className: 'cf-col cf-col-left' },
                    createElement(Toolbox, {
                        registry: defaultRegistry,
                        resolver,
                    }),
                ),
                createElement(
                    'main',
                    { className: 'cf-col cf-col-canvas' },
                    createElement(Frame, { data: initialNodes as never }),
                ),
                createElement(
                    'aside',
                    { className: 'cf-col cf-col-right' },
                    createElement(SettingsColumn, null),
                ),
            ),
            createElement(ExportBar, null),
        ),
    );
}
