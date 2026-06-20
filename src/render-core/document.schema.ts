import { z } from "zod";

import { CURRENT_SCHEMA_VERSION, type StudioDocument } from "./document";

const sectionSchema: z.ZodType<import("./document").SectionNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    order: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    children: z.array(sectionSchema).optional(),
  }),
);

export const documentSchema = z.object({
  schemaVersion: z.number().int().positive(),
  theme: z.object({
    id: z.string().min(1),
    overrides: z.record(z.string(), z.string()).optional(),
  }),
  motion: z.object({ preset: z.string().min(1) }),
  sections: z.array(sectionSchema),
});

/** Распарсить и провалидировать сырой объект. Бросает ZodError при несоответствии. */
export function parseDocument(raw: unknown): StudioDocument {
  const doc = documentSchema.parse(raw) as StudioDocument;
  // Мягкая проверка версии: пока поддерживаем только текущую.
  if (doc.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Неизвестная версия схемы: ${doc.schemaVersion}`);
  }
  return doc;
}
