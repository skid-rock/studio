import { describe, it, expect } from "vitest";

import { buildPaths } from "./geometry";
import { ENVELOPE_SCHEMA } from "./schema";
import { cloneState, type EnvelopeState } from "./state";
import { defaultsFromSchema } from "../../render-core/schema";

// Дефолты из схемы (без оверрайдов preset.json) — точная копия wed DEFAULT_STATE.
// Геометрические снапшоты совпадают со значениями из исходных тестов wed.
const SCHEMA_DEFAULTS = defaultsFromSchema<EnvelopeState>(ENVELOPE_SCHEMA);

describe("buildPaths", () => {
  it("даёт точные пути для дефолтного состояния схемы", () => {
    expect(buildPaths(SCHEMA_DEFAULTS)).toEqual({
      left: "M 0,0 L 0,100 L 48.600,51.400 Q 52.400,50 48.600,48.600 Z",
      right: "M 100,0 L 100,100 L 51.400,51.400 Q 47.600,50 51.400,48.600 Z",
      bottom: "M 0,100 L 100,100 L 51.400,51.400 Q 50,47.600 48.600,51.400 Z",
      top: "M 0,0 L 100,0 L 51.400,48.600 Q 50,52.400 48.600,48.600 Z",
    });
  });

  it("roundDir меняет знак контрольной точки дуги (наружу/внутрь)", () => {
    const outward = buildPaths({ ...cloneState(SCHEMA_DEFAULTS), roundDir: 1 });
    const inward = buildPaths({ ...cloneState(SCHEMA_DEFAULTS), roundDir: -1 });
    // верхний клапан: контрольная точка по Y = h + d (наружу) / h - d (внутрь)
    expect(outward.top).toContain("Q 50,52.400");
    expect(inward.top).toContain("Q 50,47.600");
  });

  it("foldY двигает точку схождения боковых клапанов", () => {
    const low = buildPaths({ ...cloneState(SCHEMA_DEFAULTS), foldY: 40 });
    const high = buildPaths({ ...cloneState(SCHEMA_DEFAULTS), foldY: 60 });
    // контрольная точка боковой дуги по Y = foldY
    expect(low.left).toContain("Q 52.400,40");
    expect(high.left).toContain("Q 52.400,60");
  });

  it("tipDepth=0 убирает выпуклость (контрольная точка в центре схождения)", () => {
    const flat = buildPaths({ ...cloneState(SCHEMA_DEFAULTS), tipDepth: 0 });
    // верх/низ: x=50 сырой, y=foldY через toFixed → "Q 50,50.000"
    expect(flat.top).toContain("Q 50,50.000");
    // бока: x=foldX через toFixed, y=foldY сырой → "Q 50.000,50"
    expect(flat.left).toContain("Q 50.000,50");
  });
});
