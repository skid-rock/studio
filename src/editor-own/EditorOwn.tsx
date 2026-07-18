import { useEffect, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import landingSample from '../../examples/landing.sample.json';
import { createEditorStore } from '../editor-core';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { resolveThemeCss } from '../editor/theme-assets';
import { Canvas } from './canvas';
import { CANVAS_CSS, FRAME_BASE_CSS, MODULES_CSS } from './frame-css';
import { Palette } from './palette';
import { PropertiesPanel } from './properties-panel';
import { Topbar } from './topbar';

import chromeCss from './chrome.css?raw';

// Стор — источник правды редактора; создаётся один раз на модуль (entrypoint один).
const store = createEditorStore(parseDocument(landingSample), defaultRegistry);

export function EditorOwn(): ReactElement {
    // Стабильность снапшота обеспечивает кэш в editor-core (шаг 1 плана).
    const state = useSyncExternalStore(store.subscribe, store.getState);
    const themeCss = resolveThemeCss(state.document.theme);

    // Горячие клавиши undo/redo: Cmd/Ctrl+Z и Shift+Cmd/Ctrl+Z.
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            const target = e.target as HTMLElement | null;

            // Внутри contentEditable-якоря Cmd/Ctrl+Z не перехватываем — там
            // работает нативный undo текста; undo документа доступен после blur.
            if (target?.isContentEditable) {
                return;
            }

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

            <Topbar store={store} doc={state.document} />

            <Palette
                store={store}
                registry={defaultRegistry}
                doc={state.document}
                selectedId={state.selectedId}
            />

            <Canvas
                store={store}
                doc={state.document}
                selectedId={state.selectedId}
            />

            <PropertiesPanel
                store={store}
                registry={defaultRegistry}
                doc={state.document}
                selectedId={state.selectedId}
            />
        </div>
    );
}
