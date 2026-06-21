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
import type { Config, ComponentConfig, Data } from "@measured/puck";

import type { StudioDocument, SectionNode } from "../render-core/document";
import { sortedSections } from "../render-core/document";
import { orderBetween } from "../render-core/order";
import type { BlockRegistry } from "../render-core/registry";
import { parseBySchema } from "../render-core/schema";
import { PuckBlockPreview } from "./block-preview";
import { fieldsFromSchema } from "./fields-from-schema";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Имена типов: Puck кладёт type в DOM-id ("type-<random>"); наш слэш в
//    "intro/envelope" заменяем на безопасный разделитель и держим обратимым.
// ─────────────────────────────────────────────────────────────────────────────
const PUCK_SEP = "--";
export const toPuckType = (studioType: string): string => studioType.split("/").join(PUCK_SEP);
export const toStudioType = (puckType: string): string => puckType.split(PUCK_SEP).join("/");

// ─────────────────────────────────────────────────────────────────────────────
// 1. BlockModule[] → Puck Config.
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
 *
 * registry (опц.): если передан, props каждой секции сужаются parseBySchema по
 * схеме её блока (STUDIO-013) — невалидные/неизвестные поля отбрасываются. Без
 * registry props идут как есть (обратная совместимость со старыми вызовами/тестами).
 */
export function puckToDocument(
  data: Data,
  base: StudioDocument,
  registry?: BlockRegistry,
): StudioDocument {
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
    const { id, ...rawProps } = items[i].props as Record<string, unknown> & { id: string };
    const studioType = toStudioType(items[i].type);
    const existing = prevOrderById.get(String(id));
    const upper = nextAnchor(i + 1, lastOrder);

    const canReuse: boolean =
      existing != null &&
      (lastOrder === null || existing > lastOrder) &&
      (upper === null || existing < upper);

    const order: string = canReuse ? existing! : orderBetween(lastOrder, upper);

    // Валидация props по схеме блока при записи в документ (STUDIO-013): сужаем сырые
    // props к типу блока — невалидные и неизвестные поля отбрасываются. Неизвестный
    // тип (нет в реестре) или вызов без registry — props как есть.
    const mod = registry?.get(studioType);
    const props = mod ? parseBySchema(mod.schema, rawProps) : rawProps;

    sections.push({ id: String(id), type: studioType, order, props });
    lastOrder = order;
  }

  return { ...base, sections };
}
