import { useId, useState } from 'react';
import type { ReactElement } from 'react';

import type { Param, ParamSchema } from '../render-core/schema';
import { Icon } from './icons';

/**
 * Виджеты полей ParamSchema на дизайн-системе хрома (STUDIO-048, было STUDIO-033).
 * Разметка — из эталона docs/design/templates/editor-mvp/EditorMvp.dc.html:
 * text → ch-textarea в label · color → ch-color-field (два инпута, обёртка div) ·
 * range → пара ch-range + ch-input[type=number] в ch-field__pair.
 * select по ДС не рисуется — потребителя в секциях нет (решение 8 из STUDIO-053).
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

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface FieldProps {
    param: Param;
    value: unknown;
    disabled: boolean;
    onChange: (value: unknown) => void;
}

/** text — стопкой, подпись связана вложением в label (доступное имя = подпись). */
function TextField({ param, value, disabled, onChange }: FieldProps): ReactElement {
    return (
        <label className="ch-field">
            <span className="ch-field__label">{fieldLabel(param)}</span>
            <textarea
                className="ch-textarea"
                rows={2}
                disabled={disabled}
                value={(value as string | undefined) ?? (param.def as string)}
                onChange={(e) => onChange(e.currentTarget.value)}
            />
        </label>
    );
}

/**
 * color — строкой. Обёртка поля div, а не label: в label с двумя инпутами доступное
 * имя первого включило бы значение второго (решение 10 из STUDIO-053).
 * Цвет свотча живёт в инлайновом background: собственная заливка нативного пикера в
 * ДС погашена, без style кружок всегда пустой.
 */
function ColorField({ param, value, disabled, onChange }: FieldProps): ReactElement {
    const color = ((value as string | undefined) ?? (param.def as string)) || '';
    // Черновик hex: пока строка невалидна, в документ не пишем (как NaN в числовом).
    const [draft, setDraft] = useState<string | null>(null);
    const shown = draft ?? color;

    return (
        <div className="ch-field ch-field--row">
            <span className="ch-field__label">{fieldLabel(param)}</span>
            <div className="ch-color-field">
                <input
                    className="ch-color-field__swatch"
                    type="color"
                    disabled={disabled}
                    value={color || '#000000'}
                    style={{ background: color }}
                    aria-label={fieldLabel(param)}
                    onChange={(e) => {
                        setDraft(null);
                        onChange(e.currentTarget.value);
                    }}
                />
                <input
                    className="ch-color-field__value"
                    type="text"
                    spellCheck={false}
                    disabled={disabled}
                    value={shown}
                    aria-label={`${fieldLabel(param)} — hex`}
                    onChange={(e) => {
                        const next = e.currentTarget.value;

                        setDraft(next);
                        if (HEX_RE.test(next)) {
                            onChange(next);
                        }
                    }}
                    onBlur={() => setDraft(null)}
                />
            </div>
        </div>
    );
}

/**
 * range — стопкой: пара «ползунок + точное значение». Подпись связана с ползунком
 * через for/id, у числового поля своё доступное имя (решение 2 из STUDIO-053).
 */
function RangeField({ param, value, disabled, onChange }: FieldProps): ReactElement {
    const id = useId();
    const p = param as Extract<Param, { min: number }>;
    const num = typeof value === 'number' ? value : (p.def as number);
    // Пустой/невалидный ввод в number не пишем в документ (NaN — не значение).
    const emit = (raw: number): void => {
        if (Number.isFinite(raw)) {
            onChange(raw);
        }
    };

    return (
        <div className="ch-field">
            <label className="ch-field__label" htmlFor={id}>
                {fieldLabel(param)}
            </label>
            <div className="ch-field__pair">
                <input
                    className="ch-range"
                    id={id}
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    disabled={disabled}
                    value={num}
                    onChange={(e) => emit(e.currentTarget.valueAsNumber)}
                />
                <input
                    className="ch-input"
                    type="number"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    disabled={disabled}
                    value={num}
                    aria-label={`${fieldLabel(param)} — точное значение`}
                    onChange={(e) => emit(e.currentTarget.valueAsNumber)}
                />
            </div>
        </div>
    );
}

/** Один контрол по типу параметра. Контролируемые инпуты: значение из props документа. */
function FieldWidget(props: FieldProps): ReactElement {
    switch (props.param.type) {
        case 'text':
        case 'select':
            // select потребителя в секциях не имеет; до появления — рисуем как text,
            // чтобы значение оставалось редактируемым (в ДС отдельного вида нет).
            return <TextField {...props} />;
        case 'color':
            return <ColorField {...props} />;
        default:
            // range — у RangeParam type необязателен (см. schema.ts), поэтому default.
            return <RangeField {...props} />;
    }
}

export interface SchemaFieldsProps {
    schema: ParamSchema;
    values: Record<string, unknown>;
    /** Панель без выделения: контролы глохнут, разметка та же (STUDIO-048). */
    disabled?: boolean;
    onChange: (key: string, value: unknown) => void;
}

/** Форма полей по группам схемы. Ключи элементов стабильны (group / param.key). */
export function SchemaFields({
    schema,
    values,
    disabled = false,
    onChange,
}: SchemaFieldsProps): ReactElement {
    // Групп больше одной — они сворачиваемые; открыта первая (эталон: «открыта
    // одна-две, остальные свёрнуты»). Состояние ephemeral: смена секции пересоздаёт
    // форму по key=section.id в панели, набор групп вместе с ней.
    const [open, setOpen] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(schema.map((g, i) => [g.group, i === 0])),
    );

    const fields = (group: ParamSchema[number]): ReactElement[] =>
        group.items.map((p) => (
            <FieldWidget
                key={p.key}
                param={p}
                value={values[p.key]}
                disabled={disabled}
                onChange={(v) => onChange(p.key, v)}
            />
        ));

    // Единственная группа — плоская подпись, без раскрывашки (эталон, «Расписание дня»).
    if (schema.length === 1) {
        const group = schema[0];

        return (
            <>
                <p className="ch-panel__group">{group.group}</p>
                <div className="ch-panel__stack ch-panel__stack--lg">
                    {fields(group)}
                </div>
            </>
        );
    }

    return (
        <>
            {schema.map((group, i) => (
                <div key={group.group}>
                    {i > 0 && <hr className="ch-panel__sep ch-panel__sep--flush" />}
                    <button
                        type="button"
                        className="ch-panel__section"
                        aria-expanded={open[group.group] ?? false}
                        onClick={() =>
                            setOpen((s) => ({
                                ...s,
                                [group.group]: !(s[group.group] ?? false),
                            }))
                        }
                    >
                        {group.group}
                        <span className="ch-panel__section__chev">
                            <Icon
                                name={
                                    open[group.group]
                                        ? 'chevron-down'
                                        : 'chevron-right'
                                }
                            />
                        </span>
                    </button>
                    {open[group.group] && (
                        <div className="ch-panel__section-body">{fields(group)}</div>
                    )}
                </div>
            ))}
        </>
    );
}
