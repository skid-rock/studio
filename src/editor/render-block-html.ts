import type { StudioDocument } from '../render-core/document';
import type { BlockModule } from '../render-core/types';
import type { RenderContext } from '../render-core/types';

/** Служебные поля редактора — id подмешивает холст для адресации. */
export const EDITOR_INTERNAL_KEYS = new Set(['id']);

/** Убрать служебные поля редактора перед передачей props в наш render. */
function stripInternalProps(
    props: Record<string, unknown>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(props)) {
        if (!EDITOR_INTERNAL_KEYS.has(k)) {
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
    // id снимается с props (служебный ключ холста) и уходит в контекст —
    // паритет с экспортом по ADR-0008: в сам render он не попадает ни там, ни тут.
    const ctx: RenderContext = {
        doc,
        sectionId: typeof props.id === 'string' ? props.id : '',
    };

    return mod.render(stripInternalProps(props), ctx);
}
