import type { RenderResult } from './types';

export interface PageAssets {
    themeCss: string;
    baseCss?: string;
}

/** Экранирует текст для вставки в HTML-атрибуты и текстовые узлы. */
function escHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Полный HTML-документ из результата рендера и CSS темы/блоков. */
export function buildPage(
    result: RenderResult,
    assets: PageAssets,
    title = 'Лендинг',
): string {
    return `<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${escHtml(title)}</title>
<style>${assets.baseCss ?? ''}</style>
<style>${assets.themeCss}</style>
<style>${result.css}</style>
</head><body>
${result.html}
${result.js ? `<script>${result.js}</script>` : ''}
</body></html>`;
}
