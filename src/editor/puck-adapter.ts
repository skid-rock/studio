/**
 * Мост между нашей агностичной моделью/render и Puck (Фаза 1, M1).
 *
 * ADR-0002: render блока — чистая функция props → строка HTML, React в
 * прод-вывод не попадает. Puck редактирует дерево React-компонентов, поэтому
 * здесь тонкий адаптер:
 *   1) ParamSchema  → поля панели Puck (fields);
 *   2) BlockModule  → Puck ComponentConfig, где render — React-обёртка
 *      BlockPreview, зовущая mod.render(props, ctx) → dangerouslySetInnerHTML;
 *   3) StudioDocument ↔ Puck Data — двусторонний маппинг секций.
 *
 * Импорты из Puck — ТОЛЬКО типовые (import type), кроме точки входа Editor.tsx.
 */
import { createElement } from "react";
import type { Config, ComponentConfig, Data, Field } from "@measured/puck";

import type { StudioDocument, SectionNode } from "../render-core/document";
import { sortedSections } from "../render-core/document";
import { orderBetween } from "../render-core/order";
import type { BlockRegistry } from "../render-core/registry";
import type { Param, ParamSchema } from "../render-core/schema";
import { PuckBlockPreview } from "./block-preview";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Имена типов: Puck кладёт type в DOM-id ("type-<random>"); наш слэш в
//    "intro/envelope" заменяем на безопасный разделитель и держим обратимым.
// ─────────────────────────────────────────────────────────────────────────────
const PUCK_SEP = "--";
export const toPuckType = (studioType: string): string => studioType.split("/").join(PUCK_SEP);
export const toStudioType = (puckType: string): string => puckType.split(PUCK_SEP).join("/");

// ─────────────────────────────────────────────────────────────────────────────
// 1. ParamSchema → поля панели Puck.
//    range  → number (нативное поле Puck с min/max)
//    text   → textarea
//    select → select
//    color  → custom-поле с нативным <input type="color"> (показываем, что наша
//             ParamSchema ложится и на кастомные контролы)
// ─────────────────────────────────────────────────────────────────────────────
function paramToField(p: Param): Field {
  switch (p.type) {
    case "color":
      return {
        type: "custom",
        label: p.label,
        render: ({ value, onChange }) =>
          createElement("input", {
            type: "color",
            value: (value as string | undefined) ?? p.def,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value),
          }),
      };
    case "text":
      return { type: "textarea", label: p.label };
    case "select":
      return { type: "select", label: p.label, options: p.options };
    default:
      // range — у RangeParam type необязателен (может быть undefined)
      return { type: "number", label: p.label, min: p.min, max: p.max };
  }
}

export function fieldsFromSchema(schema: ParamSchema): Record<string, Field> {
  const fields: Record<string, Field> = {};
  for (const group of schema) {
    for (const item of group.items) {
      fields[item.key] = paramToField(item);
    }
  }
  return fields;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BlockModule[] → Puck Config.
//    Актуальный doc — через EditorDocContext (см. Editor.tsx).
// ─────────────────────────────────────────────────────────────────────────────
export function makeConfig(registry: BlockRegistry): Config {
  const components: Record<string, ComponentConfig> = {};
  for (const mod of registry.list()) {
    components[toPuckType(mod.type)] = {
      label: mod.label,
      fields: fieldsFromSchema(mod.schema),
      defaultProps: { ...mod.defaults },
      render: (props: Record<string, unknown>) =>
        createElement(PuckBlockPreview, { mod, props }),
    } as ComponentConfig;
  }
  return { components } as Config;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. StudioDocument ↔ Puck Data.
// ─────────────────────────────────────────────────────────────────────────────
export function documentToPuck(doc: StudioDocument): Data {
  return {
    content: sortedSections(doc).map((s) => ({
      type: toPuckType(s.type),
      props: { ...s.props, id: s.id },
    })),
    root: { props: {} },
    zones: {},
  } as Data;
}

/**
 * Puck Data → StudioDocument: порядок берём из массива content (его задаёт DnD),
 * дробные order пересчитываем заново слева направо через fractional-indexing.
 * base даёт schemaVersion/theme/motion — Puck их не трогает.
 */
export function puckToDocument(data: Data, base: StudioDocument): StudioDocument {
  const sections: SectionNode[] = [];
  let prevOrder: string | null = null;
  for (const item of data.content) {
    const { id, ...props } = item.props as Record<string, unknown> & { id: string };
    const order = orderBetween(prevOrder, null);
    sections.push({
      id: String(id),
      type: toStudioType(item.type),
      order,
      props,
    });
    prevOrder = order;
  }
  return { ...base, sections };
}
