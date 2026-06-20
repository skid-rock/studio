/**
 * Разъезд клапанов при раскрытии: перевод «целевого px на эталоне» в CSS clamp()
 * и в эффективные пиксели для конкретного контейнера.
 *
 * Дословный порт wed/src/envelope/shift.ts (изменён только импорт типа).
 */
import type { EnvelopeState } from "./state";

/** Эталон mobile: min(360×740) — разъезд X/Y = целевое значение на этом экране. */
export const REF_VMIN_PX = 360;

/**
 * Эффективный разъезд в px для заданного vmin (1% от min(w,h)).
 * @param targetPx желаемый разъезд на эталоне REF_VMIN_PX
 * @param vminPx min(containerW, containerH) / 100
 */
export function effectiveShiftPx(
  targetPx: number,
  minPx: number,
  maxPx: number,
  vminPx: number,
): number {
  const preferred = (targetPx / REF_VMIN_PX) * vminPx * 100;
  return Math.max(minPx, Math.min(maxPx, preferred));
}

/** CSS clamp(min, preferred-в-vmin, max). */
export function buildClampCss(targetPx: number, minPx: number, maxPx: number): string {
  const vminCoeff = ((targetPx / REF_VMIN_PX) * 100).toFixed(2);
  return `clamp(${minPx}px, ${vminCoeff}vmin, ${maxPx}px)`;
}

export interface ResolvedShift {
  cssX: string;
  cssY: string;
  pxX?: number;
  pxY?: number;
}

/**
 * @param vminPx если задан — вернёт ещё и эффективные px; иначе только CSS-строки.
 */
export function resolveEnvelopeShift(state: EnvelopeState, vminPx?: number): ResolvedShift {
  const cssX = buildClampCss(state.shiftX, state.shiftXMin, state.shiftXMax);
  const cssY = buildClampCss(state.shiftY, state.shiftYMin, state.shiftYMax);

  if (vminPx == null) {
    return { cssX, cssY };
  }

  return {
    cssX,
    cssY,
    pxX: effectiveShiftPx(state.shiftX, state.shiftXMin, state.shiftXMax, vminPx),
    pxY: effectiveShiftPx(state.shiftY, state.shiftYMin, state.shiftYMax, vminPx),
  };
}
