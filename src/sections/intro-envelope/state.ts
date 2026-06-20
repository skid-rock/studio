/**
 * Состояние конверта — единственная модель данных, из которой рисуется блок
 * `intro/envelope`. Хранится в preset.json как сырой объект.
 *
 * Портировано из wed/src/envelope/state.ts. Тип объявлен как `type` (а не
 * `interface`), чтобы удовлетворять ограничению `Record<string, unknown>`
 * в `BlockModule<P>` из render-core (у интерфейсов нет неявной индекс-сигнатуры).
 */
export type EnvelopeState = {
  // Форма клапанов
  foldY: number;
  tipLength: number;
  tipDepth: number;
  roundDir: number;

  // Линии и бумага
  lineColor: string;
  lineWidth: number;
  lineOpacity: number;
  paperColor: string;
  paperAlpha: number;
  bgColor: string;

  // Печать
  sealSize: number;
  sealY: number;
  sealTextY: number;
  sealFont: number;

  // Тексты (позиции/размеры)
  deliveryY: number;
  deliveryFont: number;
  initialsY: number;
  initialsFont: number;

  // Раскрытие (разъезд клапанов)
  shiftX: number;
  shiftXMin: number;
  shiftXMax: number;
  shiftY: number;
  shiftYMin: number;
  shiftYMax: number;

  // Надписи
  deliveryText: string;
  initialsText: string;
  sealText: string;
};

export type EnvelopeKey = keyof EnvelopeState;

/** Копия состояния (чтобы не мутировать пресет напрямую). */
export function cloneState(state: EnvelopeState): EnvelopeState {
  return { ...state };
}
