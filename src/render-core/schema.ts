interface BaseParam {
    key: string;
    label: string;
}

export interface RangeParam extends BaseParam {
    type?: 'range';
    min: number;
    max: number;
    step: number;
    def: number;
    unit: string;
}

export interface ColorParam extends BaseParam {
    type: 'color';
    def: string;
}

export interface TextParam extends BaseParam {
    type: 'text';
    def: string;
}

/** Новое (под лейаут-архетипы Фазы 3): выпадающий список. */
export interface SelectParam extends BaseParam {
    type: 'select';
    options: { value: string; label: string }[];
    def: string;
}

export type Param = RangeParam | ColorParam | TextParam | SelectParam;

export interface ParamGroup {
    group: string;
    items: Param[];
}

export type ParamSchema = ParamGroup[];

/** Собрать дефолтные props из схемы (как DEFAULT_STATE в wed). */
export function defaultsFromSchema<P extends Record<string, unknown>>(
    schema: ParamSchema,
): P {
    const out = {} as Record<string, unknown>;

    for (const group of schema) {
        for (const item of group.items) {
            out[item.key] = item.def;
        }
    }

    return out as P;
}

/**
 * Проверка, что сырое значение подходит под тип параметра (рантайм-граница).
 * range — числовой параметр (у RangeParam type необязателен, может быть undefined),
 * поэтому идёт в default; color/text — строки; select — строка из списка options.
 */
function isValidParamValue(param: Param, value: unknown): boolean {
    switch (param.type) {
        case 'color':
        case 'text':
            return typeof value === 'string';
        case 'select':
            return (
                typeof value === 'string' &&
                param.options.some((o) => o.value === value)
            );
        default:
            return typeof value === 'number' && Number.isFinite(value);
    }
}

/**
 * Сузить сырые props к типу P по схеме (рантайм-граница unknown → P, в пару к
 * defaultsFromSchema). Для каждого ключа схемы берётся значение из raw, если оно
 * валидно для типа параметра; иначе подставляется def. Ключи вне схемы
 * отбрасываются. Возвращает ПОЛНЫЙ объект (все ключи схемы) — поэтому годится как
 * parse для варианта D (типизированный render получает полный P).
 *
 * Каст `as P` — единственная точка «нечестности», оправданная этой проверкой (та же
 * модель, что и в defaultsFromSchema).
 */
export function parseBySchema<P extends Record<string, unknown>>(
    schema: ParamSchema,
    raw: unknown,
): P {
    const src: Record<string, unknown> =
        raw !== null && typeof raw === 'object'
            ? (raw as Record<string, unknown>)
            : {};
    const out: Record<string, unknown> = {};

    for (const group of schema) {
        for (const item of group.items) {
            const value = src[item.key];
            out[item.key] = isValidParamValue(item, value) ? value : item.def;
        }
    }

    return out as P;
}
