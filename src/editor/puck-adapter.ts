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
// Валидность вставки — плоско по реестру (makeConfig → только зарегистрированные типы);
// правила вложенности/контейнеров — будущая фаза (STUDIO-011, семя).
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
 * Puck Data → StudioDocument. Порядок берётся из массива content (его задаёт DnD).
 *
 * Дробный order пересчитывается ПО МИНИМУМУ (принцип №9 роадмапа — вставка без
 * перенумерации): существующий ключ секции сохраняется, пока он не нарушает
 * возрастание относительно уже назначенного слева и ближайшего якоря справа;
 * новый ключ через orderBetween выдаётся только новым секциям и тем, что реально
 * сменили позицию.
 *
 * base — предыдущее состояние документа: даёт schemaVersion/theme/motion и карту
 * id→order для повторного использования ключей. Editor передаёт сюда текущий doc,
 * а не неизменный исходный документ.
 *
 * Валидность вставки — плоско по реестру; правила вложенности — будущая фаза.
 */
export function puckToDocument(data: Data, base: StudioDocument): StudioDocument {
  const prevOrderById = new Map(base.sections.map((s) => [s.id, s.order]));
  const items = data.content;

  const idOf = (i: number): string => String((items[i].props as { id: string }).id);

  // Ближайший справа существующий ключ, строго больший нижней границы lower —
  // верхняя граница для orderBetween при выдаче нового ключа.
  const nextAnchor = (from: number, lower: string | null): string | null => {
    for (let j = from; j < items.length; j++) {
      const existing = prevOrderById.get(idOf(j));
      if (existing != null && (lower === null || existing > lower)) {
        return existing;
      }
    }
    return null;
  };

  const sections: SectionNode[] = [];
  let lastOrder: string | null = null;
  for (let i = 0; i < items.length; i++) {
    const { id, ...props } = items[i].props as Record<string, unknown> & { id: string };
    const existing = prevOrderById.get(String(id));
    const upper = nextAnchor(i + 1, lastOrder);

    const canReuse: boolean =
      existing != null &&
      (lastOrder === null || existing > lastOrder) &&
      (upper === null || existing < upper);

    const order: string = canReuse ? existing! : orderBetween(lastOrder, upper);

    sections.push({ id: String(id), type: toStudioType(items[i].type), order, props });
    lastOrder = order;
  }

  return { ...base, sections };
}
