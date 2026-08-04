// CSS-константы каркаса своего редактора: нужны и холсту (EditorOwn.tsx),
// и экспорту в page-controls.tsx — вынесены, чтобы не плодить циклический импорт.
import baseCss from '../render-core/styles/base.css?raw';
import fontsCss from '../render-core/styles/fonts.css?raw';
import { defaultRegistry } from '../sections/registry.default';

/** CSS базы холста (тема подключается динамически по ThemeRef.id). */
export const FRAME_BASE_CSS = [baseCss, fontsCss].join('\n');

// CSS всех модулей реестра (list() уже уникален по type, доп.дедуп не нужен).
export const MODULES_CSS = defaultRegistry
    .list()
    .map((m) => m.css ?? '')
    .join('\n');

// Нейтрализация full-bleed конверта на холсте — приём перенесён из Editor.tsx
// (STUDIO-032): в потоке страницы конверт занимает ограниченную высоту.
export const CANVAS_CSS = `
.editor-block[data-block="intro/envelope"] {
  position: relative;
  height: 70vh;
  max-height: 560px;
  overflow: hidden;
}
.editor-block[data-block="intro/envelope"] .envelope-overlay {
  position: absolute;
}

/* Изоляция слоёв лендинга: envelope живёт на z-index:200 и без этого перекрыл бы
   мини-тулбар секции (--chrome-z-canvas). Это нейтрализация чужого контента,
   а не стиль хрома, — поэтому правило здесь, а не в ДС (STUDIO-049). */
.ch-ed-canvas {
  isolation: isolate;
}
`;
