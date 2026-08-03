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
//
// TEMP (STUDIO-047 → снести в 049): после удаления chrome.css холст остался
// без стилей секций/мини-тулбара (зона 049). Пока ch-cv-* не подключены —
// минимальная подпорка, иначе e2e DnD/undo красные и выделение не видно.
// Удалить целиком блок «TEMP own-*» при переезде холста на ch-cv-*.
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

/* TEMP own-*: снести в STUDIO-049 вместе с классами own-section/own-toolbar. */
/* Слои лендинга (envelope z-index:200) не должны перекрывать float-тулбар (z:5). */
.ch-ed-canvas {
  isolation: isolate;
}
.own-section {
  position: relative;
}
.own-section:hover {
  outline: 1px dashed color-mix(in oklab, var(--chrome-text) 40%, transparent);
  outline-offset: -1px;
}
.own-section--selected,
.own-section--selected:hover {
  outline: 2px solid var(--chrome-accent);
  outline-offset: -2px;
}
.own-section--dragging {
  opacity: 0.4;
}
.own-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: var(--chrome-z-canvas);
  display: none;
  gap: 4px;
  padding: 4px;
  background: var(--chrome-panel);
  border-radius: var(--chrome-radius-pill);
  box-shadow: var(--chrome-shadow-panel);
}
.own-section:hover .own-toolbar,
.own-section--selected .own-toolbar {
  display: flex;
}
.own-tool {
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--chrome-radius-pill);
  cursor: pointer;
  font: 13px/1 var(--chrome-font);
  color: var(--chrome-text);
}
.own-tool:hover:not(:disabled) {
  background: color-mix(in oklab, var(--chrome-text) 8%, transparent);
}
.own-tool:disabled {
  opacity: 0.35;
  cursor: default;
}
.own-tool--drag {
  cursor: grab;
}
`;
