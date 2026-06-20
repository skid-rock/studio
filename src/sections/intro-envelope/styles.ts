/**
 * CSS блока «Конверт-заставка» — строкой, чтобы он одинаково читался и в
 * Vite-превью, и в Node-экспорте (STUDIO-009), без зависимости от `.css?raw`.
 *
 * Содержимое перенесено из wed/src/styles/envelope.css. CSS-переменные
 * перекрываются инлайновым style в разметке (см. markup.ts).
 */
export const envelopeCss = `
.envelope-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--envelope-bg);
  overflow: hidden;
  transition: opacity 0.9s var(--ease-out), visibility 0.9s;
  -webkit-tap-highlight-color: transparent;
}

.envelope-overlay.is-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.envelope-overlay.is-removed {
  display: none;
}

/*
 * Классический конверт: боковые треугольники + нижний/верхний клапан с округлым кончиком.
 * Порядок перекрытия как у закрытого конверта: бока → низ → верх.
 */
.envelope__flaps {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.envelope__quarter {
  position: absolute;
  inset: 0;
  transition: translate var(--envelope-open-duration) linear var(--envelope-open-delay);
}

.envelope__quarter--left {
  z-index: 1;
}

.envelope__quarter--right {
  z-index: 2;
}

.envelope__quarter--bottom {
  z-index: 3;
}

.envelope__quarter--top {
  z-index: 4;
}

.envelope__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.envelope__flap {
  fill: var(--envelope-panel-fill);
  stroke: var(--envelope-line-color);
  stroke-width: var(--envelope-line-width);
  stroke-opacity: var(--envelope-line-opacity);
  vector-effect: non-scaling-stroke;
}

/* Лёгкая тень верхнего клапана — читается перекрытие (как на референсе) */
.envelope__quarter--top .envelope__flap {
  filter: drop-shadow(0 3px 10px rgba(30, 69, 104, 0.12));
}

.envelope-overlay.is-opening .envelope__quarter--right {
  translate: var(--envelope-flap-shift-x) 0;
}

.envelope-overlay.is-opening .envelope__quarter--left {
  translate: calc(-1 * var(--envelope-flap-shift-x)) 0;
}

.envelope-overlay.is-opening .envelope__quarter--top {
  translate: 0 calc(-1 * var(--envelope-flap-shift-y));
}

.envelope-overlay.is-opening .envelope__quarter--bottom {
  translate: 0 var(--envelope-flap-shift-y);
}

/* «Вам доставлено приглашение» — в верхнем треугольнике конверта */
.envelope__delivery {
  position: absolute;
  top: var(--envelope-delivery-top);
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--envelope-delivery-size);
  line-height: 1.3;
  color: var(--color-navy);
  z-index: 1;
  transition: opacity var(--envelope-fade-duration) ease-out;
}

.envelope-overlay.is-opening .envelope__delivery {
  opacity: 0;
}

/* Печать по центру конверта */
.envelope__seal {
  position: absolute;
  top: var(--envelope-seal-top);
  left: 50%;
  width: var(--envelope-seal-size);
  padding: 0;
  border: none;
  background: none;
  transform: translate(-50%, -50%);
  transition:
    opacity var(--envelope-fade-duration) ease-out,
    transform var(--envelope-fade-duration) var(--ease-out);
  cursor: pointer;
  z-index: 3;
}

.envelope-overlay.is-opening .envelope__seal {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.15);
}

.envelope__seal:focus-visible {
  outline: 2px solid var(--color-terracotta);
  outline-offset: 6px;
  border-radius: 50%;
}

.envelope__seal-img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 6px 14px rgba(30, 69, 104, 0.25));
}

/* «открыть» белым поверх печати (оптический центр круга выше геометрического) */
.envelope__seal-text {
  position: absolute;
  top: var(--envelope-seal-text-top);
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--envelope-seal-text-size);
  color: var(--color-cream);
  pointer-events: none;
  white-space: nowrap;
}

/* «П & И» — в нижнем треугольнике конверта */
.envelope__initials {
  position: absolute;
  top: var(--envelope-initials-top);
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-size: var(--envelope-initials-size);
  letter-spacing: 0.05em;
  color: var(--color-navy);
  z-index: 1;
  transition: opacity var(--envelope-fade-duration) ease-out;
}

.envelope-overlay.is-opening .envelope__initials {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .envelope__quarter {
    transition: opacity var(--duration-fast) ease-out;
  }

  .envelope-overlay.is-opening .envelope__quarter--right,
  .envelope-overlay.is-opening .envelope__quarter--left,
  .envelope-overlay.is-opening .envelope__quarter--top,
  .envelope-overlay.is-opening .envelope__quarter--bottom {
    translate: 0 0;
    opacity: 0;
  }
}
`;
