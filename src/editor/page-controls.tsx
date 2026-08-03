/**
 * Временный дом управления страницей (STUDIO-047): тема, оверрайды токенов,
 * сохранение/загрузка, экспорт HTML. Переехало из topbar.tsx как есть — на ДС
 * это хозяйство переводит STUDIO-048 (вкладка «Страница» правой панели).
 */
import type { ReactElement } from 'react';

import type { EditorStore } from '../editor-core';
import type { StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { DocumentActions } from './document-actions';
import { buildExportHtml, downloadHtml, formatBytes } from './export-html';
import { FRAME_BASE_CSS } from './frame-css';
import { resolveThemeCss, themeCssById } from './theme-assets';
import { ThemeOverrides } from './theme-overrides';
import { ThemeSwitcher } from './theme-switcher';

export interface PageControlsProps {
    store: EditorStore;
    doc: StudioDocument;
}

export function PageControls({ store, doc }: PageControlsProps): ReactElement {
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
        <div>
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
        </div>
    );
}
