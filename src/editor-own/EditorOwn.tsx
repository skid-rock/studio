import { useEffect, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import landingSample from '../../examples/landing.sample.json';
import { createEditorStore } from '../editor-core';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { resolveThemeCss } from '../editor/theme-assets';
import { Canvas } from './canvas';

import baseCss from '../render-core/styles/base.css?raw';
import fontsCss from '../render-core/styles/fonts.css?raw';
import chromeCss from './chrome.css?raw';

/** CSS базы холста (тема подключается динамически по ThemeRef.id). */
const FRAME_BASE_CSS = [baseCss, fontsCss].join('\n');
// CSS всех модулей реестра (list() уже уникален по type, доп.дедуп не нужен).
const MODULES_CSS = defaultRegistry
    .list()
    .map((m) => m.css ?? '')
    .join('\n');

// Нейтрализация full-bleed конверта на холсте — приём перенесён из Editor.tsx
// (STUDIO-032): в потоке страницы конверт занимает ограниченную высоту.
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

// Стор — источник правды редактора; создаётся один раз на модуль (entrypoint один).
const store = createEditorStore(parseDocument(landingSample), defaultRegistry);

export function EditorOwn(): ReactElement {
    // Стабильность снапшота обеспечивает кэш в editor-core (шаг 1 плана).
    const state = useSyncExternalStore(store.subscribe, store.getState);
    const themeCss = resolveThemeCss(state.document.theme);

    // Горячие клавиши undo/redo: Cmd/Ctrl+Z и Shift+Cmd/Ctrl+Z.
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            const mod = e.metaKey || e.ctrlKey;

            if (!mod || e.key.toLowerCase() !== 'z') {
                return;
            }
            e.preventDefault();
            if (e.shiftKey) {
                store.redo();
            } else {
                store.undo();
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="own-root">
            <style>{FRAME_BASE_CSS}</style>
            <style>{themeCss}</style>
            <style>{MODULES_CSS}</style>
            <style>{CANVAS_CSS}</style>
            <style>{chromeCss}</style>

            <header className="own-topbar">
                <span className="own-topbar__title">studio — свой редактор</span>
                <span className="own-topbar__actions">
                    <button
                        type="button"
                        className="own-tool"
                        disabled={!store.canUndo()}
                        onClick={() => store.undo()}
                        title="Отменить (Cmd/Ctrl+Z)"
                    >
                        ↩︎
                    </button>
                    <button
                        type="button"
                        className="own-tool"
                        disabled={!store.canRedo()}
                        onClick={() => store.redo()}
                        title="Повторить (Shift+Cmd/Ctrl+Z)"
                    >
                        ↪︎
                    </button>
                </span>
            </header>

            <Canvas
                store={store}
                doc={state.document}
                selectedId={state.selectedId}
            />
        </div>
    );
}
