/**
 * ParamSchema → поля панели Puck (слой «панель», изолирован от маппинга документа).
 *
 * ADR-0003: на MVP остаёмся на ParamSchema; миграция на JSON Schema/UI Schema —
 * отдельной задачей при необходимости. Этот модуль — единственная точка перевода
 * схемы в контролы, поэтому миграция будет локальной (ядро/панель изолированы).
 *
 *   range  → number (нативное поле Puck с min/max/step; unit — в подписи)
 *   text   → textarea
 *   select → select
 *   color  → custom-поле с нативным <input type="color">
 */
import { createElement } from "react";
import type { Field } from "@measured/puck";

import type { Param, ParamSchema } from "../render-core/schema";

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
    default: {
      // range — у RangeParam type необязателен (может быть undefined).
      // step важен: без него Puck шагает по целым (конверт со step 0.05 был бы
      // невыставим). unit показываем в подписи (Puck number его не отображает).
      const label = p.unit ? `${p.label}, ${p.unit}` : p.label;
      return { type: "number", label, min: p.min, max: p.max, step: p.step };
    }
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
