/**
 * СПАЙК (STUDIO-008) — ОДНА generic-панель свойств из нашей ParamSchema.
 * Порт паттерна wed/src/playground/controls.ts на React/Craft:
 *   range  → слайдер с живым readout + единицей измерения;
 *   color  → <input type="color">;
 *   text   → textarea;
 *   select → <select>.
 *
 * В Puck аналогичную панель давала сама библиотека (fieldsFromSchema → поля Puck);
 * здесь панель и её разметка пишутся руками — это часть сравнения объёма кода.
 */
import { createElement } from "react";
import type { ReactElement } from "react";

import type { Param, ParamSchema } from "../../src/render-core/schema";

export interface SchemaFieldsProps {
  schema: ParamSchema;
  props: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

/** Текстовое представление значения range (для readout): «${value}${unit}». */
function rangeReadout(p: Param, value: unknown): string {
  if (p.type === "color" || p.type === "text" || p.type === "select") {
    return "";
  }
  // RangeParam: направление (±1) подписываем словами, остальное — значение+unit
  if (p.key === "roundDir") {
    return Number(value) >= 0 ? "наружу" : "внутрь";
  }
  return `${value}${p.unit}`;
}

function Field({
  param,
  value,
  onChange,
}: {
  param: Param;
  value: unknown;
  onChange: (value: unknown) => void;
}): ReactElement {
  switch (param.type) {
    case "color":
      return createElement("input", {
        type: "color",
        value: (value as string | undefined) ?? param.def,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value),
      });
    case "text":
      return createElement("textarea", {
        rows: 2,
        value: (value as string | undefined) ?? param.def,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.currentTarget.value),
      });
    case "select":
      return createElement(
        "select",
        {
          value: (value as string | undefined) ?? param.def,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value),
        },
        param.options.map((o) =>
          createElement("option", { key: o.value, value: o.value }, o.label),
        ),
      );
    default:
      // range — слайдер, значение приводим к числу
      return createElement("input", {
        type: "range",
        min: param.min,
        max: param.max,
        step: param.step,
        value: (value as number | undefined) ?? param.def,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(parseFloat(e.currentTarget.value)),
      });
  }
}

export function SchemaFields({ schema, props, onChange }: SchemaFieldsProps): ReactElement {
  return createElement(
    "div",
    { className: "cf-panel" },
    schema.map((group) =>
      createElement(
        "div",
        { key: group.group, className: "cf-group" },
        createElement("h3", { className: "cf-group-title" }, group.group),
        group.items.map((item) => {
          const value = props[item.key];
          const readout = rangeReadout(item, value);
          return createElement(
            "label",
            { key: item.key, className: "cf-row" },
            createElement(
              "span",
              { className: "cf-label" },
              item.label,
              readout && createElement("span", { className: "cf-val" }, readout),
            ),
            createElement(Field, { param: item, value, onChange: (v) => onChange(item.key, v) }),
          );
        }),
      ),
    ),
  );
}
