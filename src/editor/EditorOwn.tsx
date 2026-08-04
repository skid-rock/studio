import { useEffect, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import landingSample from '../../examples/landing.sample.json';
import { createEditorStore } from '../editor-core';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { resolveThemeCss } from './theme-assets';
import { Canvas } from './canvas';
import { CANVAS_CSS, FRAME_BASE_CSS, MODULES_CSS } from './frame-css';
import { Icon } from './icons';
import { Palette } from './palette';
import { PropertiesPanel } from './properties-panel';
import { runModuleJs } from './section-scripts';
import { ToastProvider } from './toast';

// Таблица ДС (ch-*, --chrome-*): Vite инлайнит @import и переписывает пути шрифтов.
import './ds/styles.css';

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

            // Escape — клавиатурный путь снятия выделения (пара к клику по фону).
            // Внутри contentEditable сюда не доходим: правка текста выходит из
            // режима сама, документ не трогаем.
            if (e.key === 'Escape') {
                store.select(null);

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

    // Live-JS секций: после каждой перерисовки холста прогоняем клиентские
    // скрипты модулей (countdown и т.п.). rAF — дать React дорисовать блоки.
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            const root = document.querySelector('.ch-cv-page');

            if (root) {
                runModuleJs(root);
            }
        });

        return () => cancelAnimationFrame(raf);
    }, [state.document]);

    return (
        // Высота — inline: .ch-ed это grid без своей высоты, в эталоне она тоже
        // задана инлайном. Своего .css в src/editor/ быть не должно (STUDIO-051).
        <div
            className="ch-ed"
            style={{ height: '100dvh' }}
            onClick={(e) => {
                // Клик по сцене окна (padding/gap сетки .ch-ed), не по колоннам.
                // Сцена видна при любом scrollTop холста — в отличие от padding
                // .ch-ed-canvas, который уезжает за край (STUDIO-055).
                if (e.target === e.currentTarget) {
                    store.select(null);
                }
            }}
        >
            <ToastProvider>
                <style>{FRAME_BASE_CSS}</style>
                <style>{themeCss}</style>
                <style>{MODULES_CSS}</style>
                <style>{CANVAS_CSS}</style>

                <Palette
                    store={store}
                    registry={defaultRegistry}
                    doc={state.document}
                    selectedId={state.selectedId}
                />

                <div className="ch-ed-toolbar ch-ed-toolbar--float">
                    <button
                        type="button"
                        className="ch-btn ch-btn--ghost ch-btn--icon"
                        disabled={!store.canUndo()}
                        onClick={() => store.undo()}
                        title="Отменить (Cmd/Ctrl+Z)"
                        aria-label="Отменить (Cmd/Ctrl+Z)"
                    >
                        <Icon name="undo" />
                    </button>
                    <button
                        type="button"
                        className="ch-btn ch-btn--ghost ch-btn--icon"
                        disabled={!store.canRedo()}
                        onClick={() => store.redo()}
                        title="Повторить (Shift+Cmd/Ctrl+Z)"
                        aria-label="Повторить (Shift+Cmd/Ctrl+Z)"
                    >
                        <Icon name="redo" />
                    </button>
                </div>

                <main
                    className="ch-ed-canvas"
                    onClick={(e) => {
                        // Клик по фону холста (padding сверху/снизу) снимает выделение.
                        // Боковых гаттеров у страницы при типичном 1280 нет: колонка
                        // уже --chrome-cv-page. Доп. путь — клик по сцене .ch-ed (STUDIO-055).
                        if (!(e.target as HTMLElement).closest('.ch-cv-section')) {
                            store.select(null);
                        }
                    }}
                >
                    <Canvas
                        store={store}
                        doc={state.document}
                        selectedId={state.selectedId}
                    />
                </main>

                <PropertiesPanel
                    store={store}
                    registry={defaultRegistry}
                    doc={state.document}
                    selectedId={state.selectedId}
                />
            </ToastProvider>
        </div>
    );
}
