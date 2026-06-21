/**
 * СПАЙК (STUDIO-008) — мост между нашей агностичной моделью/render и Puck.
 *
 * Ключевая идея ADR-0002: render блока — это чистая функция props → строка HTML,
 * React в прод-вывод не попадает. Puck же редактирует дерево React-компонентов.
 * Поэтому здесь — тонкий адаптер:
 *   1) ParamSchema  → поля панели Puck (fields);
 *   2) BlockModule  → Puck ComponentConfig, где render — React-обёртка,
 *      которая зовёт mod.render(props, ctx) и вставляет HTML через
 *      dangerouslySetInnerHTML (никакого второго пути рендера);
 *   3) StudioDocument ↔ Puck Data — двусторонний маппинг секций.
 *
 * Импорты из Puck — ТОЛЬКО типовые (import type), чтобы файл оставался
 * пригодным для headless-проверки в Node (verify.mts) без загрузки браузерного
 * рантайма Puck.
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import type { Config, ComponentConfig, Data, Field } from '@measured/puck';

import type {
    StudioDocument,
    SectionNode,
} from '../../src/render-core/document';
import { sortedSections } from '../../src/render-core/document';
import { orderBetween } from '../../src/render-core/order';
import type { BlockRegistry } from '../../src/render-core/registry';
import type { Param, ParamSchema } from '../../src/render-core/schema';
import type { BlockModule, RenderContext } from '../../src/render-core/types';

// ─────────────────────────────────────────────────────────────────────────────
// 0. Имена типов: Puck кладёт type в DOM-id ("type-<random>"); наш слэш в
//    "intro/envelope" заменяем на безопасный разделитель и держим обратимым.
// ─────────────────────────────────────────────────────────────────────────────
const PUCK_SEP = '--';
export const toPuckType = (studioType: string): string =>
    studioType.split('/').join(PUCK_SEP);
export const toStudioType = (puckType: string): string =>
    puckType.split(PUCK_SEP).join('/');

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
        case 'color':
            return {
                type: 'custom',
                label: p.label,
                render: ({ value, onChange }) =>
                    createElement('input', {
                        type: 'color',
                        value: (value as string | undefined) ?? p.def,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            onChange(e.currentTarget.value),
                    }),
            };
        case 'text':
            return { type: 'textarea', label: p.label };
        case 'select':
            return { type: 'select', label: p.label, options: p.options };
        default:
            // range — у RangeParam type необязателен (может быть undefined)
            return { type: 'number', label: p.label, min: p.min, max: p.max };
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
// 2. React-обёртка блока: зовёт наш агностичный render и вставляет HTML.
//    Это единственное место, где React касается блока, — и он лишь обрамляет
//    результат строкового render (анти-drift: тот же код, что и в экспорте).
// ─────────────────────────────────────────────────────────────────────────────
const PUCK_INTERNAL_KEYS = new Set(['id', 'puck', 'editMode']);

/** Убрать служебные поля Puck перед передачей props в наш render. */
function stripPuckProps(
    props: Record<string, unknown>,
): Record<string, unknown> {
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

export interface BlockPreviewProps {
    mod: BlockModule;
    props: Record<string, unknown>;
    doc: StudioDocument;
}

export function BlockPreview({
    mod,
    props,
    doc,
}: BlockPreviewProps): ReactElement {
    const html = renderModuleHtml(mod, props, doc);
    // data-block + класс позволяют нейтрализовать position:fixed конверта в холсте
    // (см. App.tsx, .spike-block[data-block="intro/envelope"]).
    return createElement('div', {
        className: 'spike-block',
        'data-block': mod.type,
        dangerouslySetInnerHTML: { __html: html },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BlockModule[] → Puck Config.
//    getDoc даёт обёртке актуальный документ для RenderContext (envelope ctx не
//    использует, но контракт RenderFn общий — держим честно).
// ─────────────────────────────────────────────────────────────────────────────
export function makeConfig(
    registry: BlockRegistry,
    getDoc: () => StudioDocument,
): Config {
    const components: Record<string, ComponentConfig> = {};
    for (const mod of registry.list()) {
        components[toPuckType(mod.type)] = {
            label: mod.label,
            fields: fieldsFromSchema(mod.schema),
            defaultProps: { ...mod.defaults },
            render: (props: Record<string, unknown>) =>
                createElement(BlockPreview, { mod, props, doc: getDoc() }),
        } as ComponentConfig;
    }
    return { components } as Config;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. StudioDocument ↔ Puck Data.
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
export function puckToDocument(
    data: Data,
    base: StudioDocument,
): StudioDocument {
    const sections: SectionNode[] = [];
    let prevOrder: string | null = null;
    for (const item of data.content) {
        const { id, ...props } = item.props as Record<string, unknown> & {
            id: string;
        };
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
