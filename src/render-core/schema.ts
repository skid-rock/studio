interface BaseParam {
  key: string;
  label: string;
}

export interface RangeParam extends BaseParam {
  type?: "range";
  min: number;
  max: number;
  step: number;
  def: number;
  unit: string;
}

export interface ColorParam extends BaseParam {
  type: "color";
  def: string;
}

export interface TextParam extends BaseParam {
  type: "text";
  def: string;
}

/** Новое (под лейаут-архетипы Фазы 3): выпадающий список. */
export interface SelectParam extends BaseParam {
  type: "select";
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
export function defaultsFromSchema<P extends Record<string, unknown>>(schema: ParamSchema): P {
  const out = {} as Record<string, unknown>;
  for (const group of schema) {
    for (const item of group.items) {
      out[item.key] = item.def;
    }
  }
  return out as P;
}
