/**
 * Шапка своего редактора (STUDIO-034): undo/redo, темы, оверрайды токенов,
 * сохранение/загрузка документа, экспорт HTML.
 *
 * Урок STUDIO-015: Topbar — модульный компонент (стабильная ссылка), данные идут
 * пропсами. Смена данных ре-рендерит шапку, а не ремоунтит — фокус текстовых
 * полей ThemeOverrides (шрифты) сохраняется.
 */
import type { ReactElement } from 'react';

import type { EditorStore } from '../editor-core';
import type { StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { ThemeSwitcher } from './theme-switcher';
import { ThemeOverrides } from './theme-overrides';
import { DocumentActions } from './document-actions';
import { themeCssById, resolveThemeCss } from './theme-assets';
import {
    buildExportHtml,
    downloadHtml,
    formatBytes,
} from './export-html';
import { FRAME_BASE_CSS } from './frame-css';

export interface TopbarProps {
    store: EditorStore;
    doc: StudioDocument;
}

export function Topbar({ store, doc }: TopbarProps): ReactElement {
    /** Изменить точечный оверрайд токена темы ('' — снять оверрайд). */
    const handleOverrideChange = (key: string, value: string): void => {
        const overrides = { ...(doc.theme.overrides ?? {}) };

        if (value) {
            overrides[key] = value;
        } else {
            delete overrides[key];
        }
        store.setThemeOverrides(overrides);
    };

    /** Собрать index.html текущего документа, замерить вес, скачать. */
    const handleExport = (): void => {
        const { html, bytes, withinBudget } = buildExportHtml(
            doc,
            defaultRegistry,
            { baseCss: FRAME_BASE_CSS, themeCss: resolveThemeCss(doc.theme) },
        );

        downloadHtml(html);
        // Отчёт о весе: бюджет — самостоятельный index.html без внешних картинок/шрифтов.
        const status = withinBudget ? 'в бюджете' : 'ПРЕВЫШЕН бюджет';

        console.info(`Экспорт: ${formatBytes(bytes)} (${status})`);
        alert(
            `Экспортирован index.html\nВес: ${formatBytes(bytes)} — ${status}\n` +
                `(картинки и шрифты подключаются ссылками и в этот вес не входят)`,
        );
    };

    return (
        <header className="own-topbar">
            <span className="own-topbar__title">studio — свой редактор</span>
            <span className="own-topbar__actions">
                <button
                    type="button"
                    className="own-tool"
                    disabled={!store.canUndo()}
                    onClick={() => store.undo()}
                    title="Отменить (Cmd/Ctrl+Z)"
                    aria-label="Отменить (Cmd/Ctrl+Z)"
                >
                    ↩︎
                </button>
                <button
                    type="button"
                    className="own-tool"
                    disabled={!store.canRedo()}
                    onClick={() => store.redo()}
                    title="Повторить (Shift+Cmd/Ctrl+Z)"
                    aria-label="Повторить (Shift+Cmd/Ctrl+Z)"
                >
                    ↪︎
                </button>
                <ThemeSwitcher
                    value={doc.theme.id}
                    onChange={(id) => store.setTheme(id)}
                />
                <ThemeOverrides
                    value={doc.theme.overrides}
                    presetCss={themeCssById(doc.theme.id)}
                    onChange={handleOverrideChange}
                />
                <DocumentActions
                    getDoc={() => store.getState().document}
                    onLoad={(loaded) => store.loadDocument(loaded)}
                    onExport={handleExport}
                />
            </span>
        </header>
    );
}
