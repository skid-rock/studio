/**
 * Браузерный экспорт лендинга в самостоятельный index.html (STUDIO-025).
 * Тот же путь рендера, что и превью/Node-экспорт: renderDocument + buildPage
 * (ADR «один путь рендера»). Картинки/шрифты остаются внешними ссылками
 * (img/…, fonts/…) — инлайн ассетов вне скоупа. Слой редактора (DOM допустим).
 */
import type { StudioDocument } from '../render-core/document';
import { buildPage } from '../render-core/page';
import { renderDocument } from '../render-core/render';
import type { BlockRegistry } from '../render-core/registry';

/**
 * Бюджет веса самого index.html (HTML + инлайн CSS + инлайн JS), без внешних
 * картинок/шрифтов. Ориентир — «на порядок легче Tilda-аналога ≈1.9 МБ»:
 * берём 190 КБ как верхнюю границу (на порядок = ÷10). Клиентский JS countdown
 * (STUDIO-019) инлайнится в <script> и уже входит в этот вес.
 */
export const WEIGHT_BUDGET_BYTES = 190 * 1024;

export interface ExportAssets {
    /** CSS базы холста (base.css + fonts.css), как в Editor.tsx. */
    baseCss: string;
    /** CSS темы документа (resolveThemeCss / themeCssById). */
    themeCss: string;
}

export interface ExportResult {
    html: string;
    /** Размер html в байтах (UTF-8). */
    bytes: number;
    /** Уложились ли в WEIGHT_BUDGET_BYTES. */
    withinBudget: boolean;
}

/** Собрать финальный HTML текущего документа + замерить вес. */
export function buildExportHtml(
    doc: StudioDocument,
    registry: BlockRegistry,
    assets: ExportAssets,
    title = 'Лендинг',
): ExportResult {
    const result = renderDocument(doc, { registry });
    const html = buildPage(
        result,
        { themeCss: assets.themeCss, baseCss: assets.baseCss },
        title,
    );
    // UTF-8 байты, а не длина строки: кириллица/эмодзи весят больше 1 символа.
    const bytes = new TextEncoder().encode(html).length;

    return { html, bytes, withinBudget: bytes <= WEIGHT_BUDGET_BYTES };
}

/** Скачать готовый HTML как файл (паттерн Blob + <a download>). */
export function downloadHtml(html: string, filename = 'index.html'): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Человекочитаемый размер для отчёта в UI. */
export function formatBytes(bytes: number): string {
    return bytes < 1024 ? `${bytes} Б` : `${(bytes / 1024).toFixed(1)} КБ`;
}
