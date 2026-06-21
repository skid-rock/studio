import type { StudioDocument } from "../render-core/document";
import type { BlockModule } from "../render-core/types";
import type { RenderContext } from "../render-core/types";

/** Служебные поля Puck — не идут в наш render и нестабильны между рендерами. */
export const PUCK_INTERNAL_KEYS = new Set(["id", "puck", "editMode"]);

/** Убрать служебные поля Puck перед передачей props в наш render. */
function stripPuckProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!PUCK_INTERNAL_KEYS.has(k)) {
      out[k] = v;
    }
  }
  return out;
}

/** Прогнать props через агностичный mod.render — строка HTML (как в экспорте). */
export function renderModuleHtml(
  mod: BlockModule,
  props: Record<string, unknown>,
  doc: StudioDocument,
): string {
  const ctx: RenderContext = { doc };
  return mod.render(stripPuckProps(props), ctx);
}
