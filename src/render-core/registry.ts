import { parseBySchema } from './schema';
import type { BlockModule } from './types';

// Реестр гетерогенный — хранит модули с разными типами props в одной Map. Узкий
// BlockModule<P> НЕ присваивается BlockModule<Record<string, unknown>>: единственный
// блокер — КОНТРАВАРИАНТНОСТЬ render (RenderFn<P> в позиции входа при
// strictFunctionTypes); defaults (ковариантная позиция) присваивается без проблем.
// Поэтому реестр хранит уже СТЁРТЫЙ BlockModule, а сужение unknown → P вынесено в
// defineBlock (вариант D из docs/improvements.md, IMP-001): стирание оправдано
// рантайм-проверкой parse — `any` и eslint-disable здесь больше не нужны.
export interface BlockRegistry {
    register(module: BlockModule): void;
    get(type: string): BlockModule | undefined;
    list(): BlockModule[];
}

export function createRegistry(
    modules: readonly BlockModule[] = [],
): BlockRegistry {
    const map = new Map<string, BlockModule>();

    for (const m of modules) {
        map.set(m.type, m);
    }

    return {
        register(m) {
            map.set(m.type, m);
        },
        get(type) {
            return map.get(type);
        },
        list() {
            return [...map.values()];
        },
    };
}

/**
 * Стереть тип P узкого модуля до BlockModule для хранения в реестре (вариант D,
 * IMP-001). Единственная задокументированная точка стирания P. Каста НЕТ: render
 * оборачивается замыканием, которое реально сужает unknown → P рантайм-парсером
 * parseBySchema (построен из schema модуля); defaults: P присваивается
 * Record<string, unknown> как ковариантная позиция. Авторская типизация модуля
 * (BlockModule<EnvelopeState> и т.п.) при этом сохраняется и проверяется как раньше.
 */
export function defineBlock<P extends Record<string, unknown>>(
    m: BlockModule<P>,
): BlockModule {
    return {
        type: m.type,
        label: m.label,
        schema: m.schema,
        defaults: m.defaults,
        css: m.css,
        js: m.js,
        render: (raw, ctx) => m.render(parseBySchema<P>(m.schema, raw), ctx),
    };
}
