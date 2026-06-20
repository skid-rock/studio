import type { StudioDocument } from "./document";
import { sortedSections } from "./document";
import type { BlockRegistry } from "./registry";
import type { RenderContext, RenderResult } from "./types";

export interface RenderOptions {
  registry: BlockRegistry;
}

export function renderDocument(doc: StudioDocument, opts: RenderOptions): RenderResult {
  const ctx: RenderContext = { doc };
  const cssParts = new Map<string, string>(); // type -> css (дедуп по типу)
  const htmlParts: string[] = [];

  for (const node of sortedSections(doc)) {
    const mod = opts.registry.get(node.type);
    if (!mod) {
      // Неизвестный тип НЕ роняет render — оставляем комментарий-заглушку.
      htmlParts.push(`<!-- unknown block: ${escapeComment(node.type)} -->`);
      continue;
    }
    if (mod.css && !cssParts.has(mod.type)) {
      cssParts.set(mod.type, mod.css);
    }
    htmlParts.push(mod.render(node.props, ctx));
  }

  return { html: htmlParts.join("\n"), css: [...cssParts.values()].join("\n") };
}

function escapeComment(s: string): string {
  return s.replace(/--/g, "—");
}
