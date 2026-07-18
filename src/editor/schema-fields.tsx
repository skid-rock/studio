import type { ReactElement } from 'react';

import type { Param, ParamSchema } from '../render-core/schema';

/**
 * Собственные React-виджеты полей из ParamSchema (STUDIO-033, без Puck).
 * Маппинг повторяет спецификацию Puck-версии (src/editor/fields-from-schema.ts)
 * и мокап STUDIO-030 (docs/design/editor/editor.css, комментарии к .field--*):
 * text → textarea · select → select · color → свотч + hex · range → range + number.
 *
 * Все компоненты объявлены на уровне модуля — стабильные ссылки, чтобы React не
 * ремоунтил поддерево формы и фокус не слетал при вводе (урок STUDIO-015).
 */

/** Подпись поля: у range к label добавляется единица измерения. */
function fieldLabel(p: Param): string {
    if ((p.type === undefined || p.type === 'range') && p.unit) {
        return `${p.label}, ${p.unit}`;
    }

    return p.label;
}

interface WidgetProps {
    param: Param;
    value: unknown;
    onChange: (value: unknown) => void;
}

/** Один контрол по типу параметра. Контролируемые инпуты: значение из props документа. */
function FieldWidget({ param, value, onChange }: WidgetProps): ReactElement {
    switch (param.type) {
        case 'text':
            return (
                <textarea
                    className="own-field__textarea"
                    rows={3}
                    value={(value as string | undefined) ?? param.def}
                    onChange={(e) => onChange(e.currentTarget.value)}
                />
            );
        case 'select':
            return (
                <select
                    className="own-field__select"
                    value={(value as string | undefined) ?? param.def}
                    onChange={(e) => onChange(e.currentTarget.value)}
                >
                    {param.options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            );
        case 'color': {
            const color = (value as string | undefined) ?? param.def;

            return (
                <span className="own-field__color">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => onChange(e.currentTarget.value)}
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => onChange(e.currentTarget.value)}
                    />
                </span>
            );
        }
        default: {
            // range — у RangeParam type необязателен (см. schema.ts), поэтому default.
            const num = typeof value === 'number' ? value : param.def;
            // Пустой/невалидный ввод в number не пишем в документ (NaN — не значение).
            const emitNumber = (raw: number): void => {
                if (Number.isFinite(raw)) {
                    onChange(raw);
                }
            };

            return (
                <span className="own-field__range">
                    <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={num}
                        onChange={(e) => emitNumber(e.currentTarget.valueAsNumber)}
                    />
                    <input
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={num}
                        onChange={(e) => emitNumber(e.currentTarget.valueAsNumber)}
                    />
                </span>
            );
        }
    }
}

export interface SchemaFieldsProps {
    schema: ParamSchema;
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

/** Форма полей по группам схемы. Ключи элементов стабильны (group / param.key). */
export function SchemaFields({
    schema,
    values,
    onChange,
}: SchemaFieldsProps): ReactElement {
    return (
        <>
            {schema.map((group) => (
                <div className="own-field-group" key={group.group}>
                    <h3 className="own-field-group__title">{group.group}</h3>
                    {group.items.map((p) => (
                        <label className="own-field" key={p.key}>
                            <span className="own-field__label">{fieldLabel(p)}</span>
                            <FieldWidget
                                param={p}
                                value={values[p.key]}
                                onChange={(v) => onChange(p.key, v)}
                            />
                        </label>
                    ))}
                </div>
            ))}
        </>
    );
}
