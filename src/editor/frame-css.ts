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

/* RSVP-попап на холсте — в потоке под секцией, чтобы тексты анкеты
   были видны и доступны inline (STUDIO-061). */
.editor-block[data-block="rsvp"] .s-rsvp-popup {
  display: block;
  position: relative;
  inset: auto;
  z-index: auto;
  margin-top: 1.5rem;
}
.editor-block[data-block="rsvp"] .s-rsvp-popup__backdrop,
.editor-block[data-block="rsvp"] .s-rsvp-popup__close {
  display: none;
}
.editor-block[data-block="rsvp"] .s-rsvp-popup__panel {
  max-height: none;
  overflow: visible;
}

/* Изоляция stacking context холста: без неё envelope (z-index:200 внутри секции)
   пробивает колонки редактора и перекрывает палитру/правую панель. Это
   нейтрализация чужого контента лендинга, не стиль хрома — поэтому здесь, а не
   в ДС (STUDIO-049).
   Не чинит мини-тулбар поверх шторки самого конверта: внутри секции overlay
   по-прежнему выше float-тулбара — отдельный дефект, не зона этой подпорки. */
.ch-ed-canvas {
  isolation: isolate;
}
`;
