/**
 * Вкладка «Страница» правой панели (STUDIO-048): тема, оверрайды токенов,
 * сохранение/загрузка, экспорт HTML. Разметка — эталон editor-mvp, строки 138–160.
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
import { useToast } from './toast';

export interface PageTabProps {
    store: EditorStore;
    doc: StudioDocument;
}

export function PageTab({ store, doc }: PageTabProps): ReactElement {
    const showToast = useToast();

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

    /** Собрать index.html текущего документа, замерить вес, скачать, отчитаться тостом. */
    const handleExport = (): void => {
        const { html, bytes, withinBudget } = buildExportHtml(
            doc,
            defaultRegistry,
            { baseCss: FRAME_BASE_CSS, themeCss: resolveThemeCss(doc.theme) },
        );

        downloadHtml(html);
        // Бюджет — самостоятельный index.html без внешних картинок/шрифтов.
        const status = withinBudget ? 'в бюджете' : 'ПРЕВЫШЕН бюджет';

        showToast({
            text: `Экспортирован index.html — ${formatBytes(bytes)}, ${status}`,
            danger: !withinBudget,
        });
    };

    return (
        <>
            <p className="ch-panel__title">Страница</p>
            <ThemeSwitcher
                value={doc.theme.id}
                onChange={(id) => store.setTheme(id)}
            />
            <p className="ch-panel__hint">
                Оверрайды пишутся в документ и уезжают в экспорт.
            </p>
            <hr className="ch-panel__sep ch-panel__sep--flush" />
            <ThemeOverrides
                value={doc.theme.overrides}
                presetCss={themeCssById(doc.theme.id)}
                onChange={handleOverrideChange}
            />
            <hr className="ch-panel__sep ch-panel__sep--flush" />
            <DocumentActions
                getDoc={() => store.getState().document}
                onLoad={(loaded) => store.loadDocument(loaded)}
                onExport={handleExport}
            />
        </>
    );
}
