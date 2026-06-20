/**
 * Геометрия клапанов конверта. ОДИН источник истины для рендера блока.
 * viewBox 0..100, точка схождения P = (50, foldY).
 *
 * Дословный порт wed/src/envelope/geometry.ts (изменён только импорт типа).
 */
import type { EnvelopeState } from "./state";

export interface FlapPaths {
  left: string;
  right: string;
  top: string;
  bottom: string;
}

export function buildPaths(state: EnvelopeState): FlapPaths {
  const h = state.foldY;
  const f = state.tipLength / 50; // доля длины ребра, которую занимает дуга
  const d = state.tipDepth * state.roundDir; // глубина дуги (+ наружу, − внутрь)

  const tEx = (50 + 50 * f).toFixed(3);
  const tEx2 = (50 - 50 * f).toFixed(3);
  const tEy = (h * (1 - f)).toFixed(3);
  const bEy = (h + (100 - h) * f).toFixed(3);

  const lEx = (50 * (1 - f)).toFixed(3);
  const lEyTop = tEy;
  const lEyBot = bEy;

  const rEx = (50 + 50 * f).toFixed(3);
  const rEyTop = tEy;
  const rEyBot = bEy;

  const left = `M 0,0 L 0,100 L ${lEx},${lEyBot} Q ${(50 + d).toFixed(3)},${h} ${lEx},${lEyTop} Z`;
  const right = `M 100,0 L 100,100 L ${rEx},${rEyBot} Q ${(50 - d).toFixed(3)},${h} ${rEx},${rEyTop} Z`;
  const top = `M 0,0 L 100,0 L ${tEx},${tEy} Q 50,${(h + d).toFixed(3)} ${tEx2},${tEy} Z`;
  const bottom = `M 0,100 L 100,100 L ${tEx},${bEy} Q 50,${(h - d).toFixed(3)} ${tEx2},${bEy} Z`;

  return { left, right, top, bottom };
}
