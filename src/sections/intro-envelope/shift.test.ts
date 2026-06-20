import { describe, it, expect } from "vitest";

import { buildClampCss, effectiveShiftPx, resolveEnvelopeShift, REF_VMIN_PX } from "./shift";
import { ENVELOPE_SCHEMA } from "./schema";
import type { EnvelopeState } from "./state";
import { defaultsFromSchema } from "../../render-core/schema";

// Дефолты из схемы (без оверрайдов preset.json) — совпадают с wed DEFAULT_STATE.
const SCHEMA_DEFAULTS = defaultsFromSchema<EnvelopeState>(ENVELOPE_SCHEMA);

describe("buildClampCss", () => {
  it("переводит целевой px на эталоне в clamp с vmin-коэффициентом", () => {
    // 160px на 360px-эталоне = 160/360*100 = 44.44vmin
    expect(buildClampCss(160, 120, 220)).toBe("clamp(120px, 44.44vmin, 220px)");
    expect(buildClampCss(320, 200, 320)).toBe("clamp(200px, 88.89vmin, 320px)");
  });
});

describe("effectiveShiftPx", () => {
  it("на эталонном vmin возвращает целевое значение", () => {
    // vminPx = 360/100 = 3.6 → preferred = 160/360*3.6*100 = 160
    expect(effectiveShiftPx(160, 120, 220, REF_VMIN_PX / 100)).toBe(160);
  });

  it("обрезается снизу и сверху", () => {
    expect(effectiveShiftPx(160, 120, 220, 0.5)).toBe(120); // маленький экран → min
    expect(effectiveShiftPx(160, 120, 220, 100)).toBe(220); // большой экран → max
  });
});

describe("resolveEnvelopeShift", () => {
  it("без vminPx отдаёт только CSS-строки", () => {
    const r = resolveEnvelopeShift(SCHEMA_DEFAULTS);
    expect(r).toEqual({
      cssX: "clamp(120px, 44.44vmin, 220px)",
      cssY: "clamp(200px, 88.89vmin, 320px)",
    });
    expect(r.pxX).toBeUndefined();
  });

  it("с vminPx добавляет эффективные px", () => {
    const r = resolveEnvelopeShift(SCHEMA_DEFAULTS, REF_VMIN_PX / 100);
    expect(r.pxX).toBe(160);
    expect(r.pxY).toBe(320); // 320/360*3.6*100 = 320, в пределах [200,320]
  });
});
