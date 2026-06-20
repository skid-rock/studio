import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import sampleJson from "../../examples/document.sample.json";
import { CURRENT_SCHEMA_VERSION } from "./document";
import { parseDocument } from "./document.schema";

describe("parseDocument", () => {
  it("валидирует пример document.sample.json", () => {
    const doc = parseDocument(sampleJson);

    expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(doc.theme.id).toBe("cream-navy");
    expect(doc.sections).toHaveLength(2);
  });

  it("бросает ZodError при невалидной структуре", () => {
    expect(() => parseDocument({ schemaVersion: 1 })).toThrow(ZodError);
  });

  it("бросает ошибку при неподдерживаемой версии схемы", () => {
    const invalidVersion = {
      ...sampleJson,
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
    };

    expect(() => parseDocument(invalidVersion)).toThrow(/Неизвестная версия схемы/);
  });
});
