/**
 * СПАЙК (STUDIO-008) — мост между нашей агностичной моделью/render и Craft.js.
 * Зеркало `spikes/editor/puck-adapter.tsx`, но под другую базу редактора.
 *
 * Ключевая идея ADR-0002: render блока — чистая функция props → строка HTML,
 * React в прод-вывод не попадает. Craft.js же редактирует дерево React-узлов.
 * Поэтому здесь — тонкий адаптер:
 *   1) BlockHtml — ЧИСТАЯ презентация: зовёт mod.render(props, ctx) и вставляет
 *      HTML через dangerouslySetInnerHTML (никакого второго пути рендера);
 *   2) makeBlockComponent — Craft user-component (resolver), оборачивающий
 *      BlockHtml в connect(drag(dom)) + подсветку выделения (useNode);
 *   3) makeSettings — related.settings: панель свойств узла из ParamSchema;
 *   4) StudioDocument ↔ SerializedNodes Craft — двусторонний маппинг секций.
 *
 * В отличие от Puck (один `makeConfig` + готовая панель полей), здесь руками
 * пишутся: resolver-компоненты, сериализация дерево↔плоский документ и панель
 * свойств — это и есть предмет эмпирического сравнения (см. README спайка).
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { useNode } from '@craftjs/core';
import type { UserComponent } from '@craftjs/core';

import { SchemaFields } from './SchemaFields';
import type {
    StudioDocument,
    SectionNode,
} from '../../src/render-core/document';
import { sortedSections } from '../../src/render-core/document';
import { orderBetween } from '../../src/render-core/order';
import type { BlockRegistry } from '../../src/render-core/registry';
import type { BlockModule, RenderContext } from '../../src/render-core/types';

// ─────────────────────────────────────────────────────────────────────────────
// 0. Имена типов: ключ resolver'а Craft держим без "/" (как Puck-ключ), чтобы не
//    зависеть от разрешённых символов в resolvedName. Маппинг обратим.
// ─────────────────────────────────────────────────────────────────────────────
const CRAFT_SEP = '--';
export const toCraftType = (studioType: string): string =>
    studioType.split('/').join(CRAFT_SEP);
export const toStudioType = (craftType: string): string =>
    craftType.split(CRAFT_SEP).join('/');

/** Идентификатор ROOT-узла Craft (canvas-контейнер холста). */
export const CRAFT_ROOT = 'ROOT';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Чистая презентация блока (без Craft-хуков) — пригодна для headless-проверки
//    анти-drift в Node (verify.mts), как BlockPreview в Puck-спайке.
// ─────────────────────────────────────────────────────────────────────────────

/** Прогнать props через агностичный mod.render — строка HTML (как в экспорте). */
export function renderModuleHtml(
    mod: BlockModule,
    props: Record<string, unknown>,
    doc: StudioDocument,
): string {
    const ctx: RenderContext = { doc };
    return mod.render(props, ctx);
}

export interface BlockHtmlProps {
    mod: BlockModule;
    props: Record<string, unknown>;
    doc: StudioDocument;
}

/**
 * Чистый компонент-обёртка: единственное место, где React касается блока, и он
 * лишь обрамляет результат строкового render (анти-drift: тот же путь, что и в
 * экспорте). data-block позволяет нейтрализовать position:fixed конверта в холсте.
 */
export function BlockHtml({ mod, props, doc }: BlockHtmlProps): ReactElement {
    const html = renderModuleHtml(mod, props, doc);
    return createElement('div', {
        className: 'craft-block-inner',
        'data-block': mod.type,
        dangerouslySetInnerHTML: { __html: html },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Craft user-component на тип блока (для resolver). Оборачивает BlockHtml в
//    connect(drag(dom)) и подсвечивает выделение. Фабрика замыкает mod и getDoc,
//    потому что Craft инстанцирует компонент по resolvedName и не пробрасывает их.
// ─────────────────────────────────────────────────────────────────────────────
export type BlockComponent = UserComponent<Record<string, unknown>>;

export function makeBlockComponent(
    mod: BlockModule,
    getDoc: () => StudioDocument,
): BlockComponent {
    const Block: BlockComponent = (props: Record<string, unknown>) => {
        const {
            connectors: { connect, drag },
            selected,
        } = useNode((node) => ({ selected: node.events.selected }));

        return createElement(
            'div',
            {
                // connect(drag(dom)) — узел реагирует на выбор и его можно перетаскивать
                ref: (dom: HTMLElement | null) => {
                    if (dom) {
                        connect(drag(dom));
                    }
                },
                className: `craft-block${selected ? ' is-selected' : ''}`,
                'data-block': mod.type,
            },
            createElement(BlockHtml, { mod, props, doc: getDoc() }),
        );
    };

    Block.craft = {
        displayName: mod.label,
        props: { ...mod.defaults },
        related: { settings: makeSettings(mod) },
    };
    return Block;
}

/** Резолвер для <Editor resolvers={...}>: ключ-тип (без "/") → user-component. */
export function makeResolver(
    registry: BlockRegistry,
    getDoc: () => StudioDocument,
): Record<string, BlockComponent> {
    const resolver: Record<string, BlockComponent> = {};
    for (const mod of registry.list()) {
        resolver[toCraftType(mod.type)] = makeBlockComponent(mod, getDoc);
    }
    return resolver;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. related.settings — панель свойств выделенного узла из ParamSchema модуля.
//    Craft рендерит related-компонент в контексте узла, поэтому здесь доступны
//    useNode (props + setProp). Это порт паттерна wed/playground/controls.ts.
// ─────────────────────────────────────────────────────────────────────────────
export function makeSettings(mod: BlockModule): React.ComponentType {
    const Settings = (): ReactElement => {
        const {
            props,
            actions: { setProp },
        } = useNode((node) => ({
            props: node.data.props as Record<string, unknown>,
        }));

        const set = (key: string, value: unknown): void => {
            setProp((p: Record<string, unknown>) => {
                p[key] = value;
            });
        };

        return createElement(SchemaFields, {
            schema: mod.schema,
            props,
            onChange: set,
        });
    };
    return Settings;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. StudioDocument ↔ SerializedNodes Craft.
//    Craft хранит дерево плоской мапой по id; ROOT — canvas-контейнер, порядок
//    секций задаёт массив ROOT.nodes. id секции = id узла Craft (без дублей).
// ─────────────────────────────────────────────────────────────────────────────

/** Плоская мапа сериализованного состояния Craft (см. SerializedNodes). */
export type CraftNodes = Record<string, Record<string, unknown>>;

export function documentToCraft(doc: StudioDocument): CraftNodes {
    const sections = sortedSections(doc);
    const nodes: CraftNodes = {
        [CRAFT_ROOT]: {
            type: 'div',
            isCanvas: true,
            props: { className: 'craft-canvas' },
            parent: null,
            displayName: 'Холст',
            custom: {},
            hidden: false,
            nodes: sections.map((s) => s.id),
            linkedNodes: {},
        },
    };

    for (const s of sections) {
        nodes[s.id] = {
            type: { resolvedName: toCraftType(s.type) },
            isCanvas: false,
            props: { ...s.props },
            parent: CRAFT_ROOT,
            displayName: s.type,
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
        };
    }

    return nodes;
}

/**
 * SerializedNodes Craft → StudioDocument: порядок берём из ROOT.nodes (его задаёт
 * DnD), дробные order пересчитываем заново слева направо через fractional-indexing.
 * base даёт schemaVersion/theme/motion — Craft их не трогает.
 */
export function craftToDocument(
    nodes: CraftNodes,
    base: StudioDocument,
): StudioDocument {
    const root = nodes[CRAFT_ROOT];
    const childIds = (root?.nodes as string[] | undefined) ?? [];

    const sections: SectionNode[] = [];
    let prevOrder: string | null = null;
    for (const id of childIds) {
        const node = nodes[id];
        if (!node) {
            continue;
        }
        const order = orderBetween(prevOrder, null);
        sections.push({
            id,
            type: toStudioType(craftResolvedName(node)),
            order,
            props: (node.props as Record<string, unknown>) ?? {},
        });
        prevOrder = order;
    }
    return { ...base, sections };
}

/** resolvedName узла Craft (type может быть строкой или {resolvedName}). */
function craftResolvedName(node: Record<string, unknown>): string {
    const type = node.type;
    if (typeof type === 'string') {
        return type;
    }
    return String((type as { resolvedName: string }).resolvedName);
}
