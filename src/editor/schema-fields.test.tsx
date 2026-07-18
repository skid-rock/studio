/**
 * STUDIO-033: собственные виджеты ParamSchema → DOM-контролы (зеркало
 * fields-from-schema.test.ts + вызовы onChange с правильными типами).
 *
 * @vitest-environment happy-dom
 */
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { ParamSchema } from '../render-core/schema';
import { SchemaFields } from './schema-fields';

// React 19: без флага act(...) пишет warning и события могут не дойти.
beforeAll(() => {
    (
        globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
});

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
    act(() => {
        root.unmount();
    });
    container.remove();
});

function mount(
    schema: ParamSchema,
    values: Record<string, unknown>,
    onChange: (key: string, value: unknown) => void = vi.fn(),
): { onChange: typeof onChange } {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
        root.render(
            <SchemaFields schema={schema} values={values} onChange={onChange} />,
        );
    });

    return { onChange };
}

/** Симуляция ввода: React слушает native value tracker + input/change. */
function setInputValue(
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string,
): void {
    const proto =
        el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : el instanceof HTMLSelectElement
              ? HTMLSelectElement.prototype
              : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    desc?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('SchemaFields', () => {
    it('range без type → range + number; unit в подписи', () => {
        const schema: ParamSchema = [
            {
                group: 'Линии',
                items: [
                    {
                        key: 'lineWidth',
                        label: 'Толщина линии',
                        min: 0,
                        max: 4,
                        step: 0.25,
                        def: 1,
                        unit: 'px',
                    },
                ],
            },
        ];

        mount(schema, { lineWidth: 1.5 });

        expect(container.querySelector('.own-field__label')?.textContent).toBe(
            'Толщина линии, px',
        );
        const range = container.querySelector(
            'input[type="range"]',
        ) as HTMLInputElement;
        const number = container.querySelector(
            'input[type="number"]',
        ) as HTMLInputElement;
        expect(range).toBeTruthy();
        expect(number).toBeTruthy();
        expect(range.min).toBe('0');
        expect(range.max).toBe('4');
        expect(range.step).toBe('0.25');
        expect(range.value).toBe('1.5');
        expect(number.value).toBe('1.5');
    });

    it('range с пустым unit — label без суффикса', () => {
        const schema: ParamSchema = [
            {
                group: 'Форма',
                items: [
                    {
                        key: 'tipLength',
                        label: 'Длина дуги',
                        min: 0,
                        max: 15,
                        step: 0.1,
                        def: 1.4,
                        unit: '',
                    },
                ],
            },
        ];

        mount(schema, {});

        expect(container.querySelector('.own-field__label')?.textContent).toBe(
            'Длина дуги',
        );
    });

    it('text → textarea', () => {
        const schema: ParamSchema = [
            {
                group: 'Текст',
                items: [
                    { key: 'names', label: 'Имена', type: 'text', def: '' },
                ],
            },
        ];

        mount(schema, { names: 'А & Б' });

        const ta = container.querySelector(
            'textarea.own-field__textarea',
        ) as HTMLTextAreaElement;
        expect(ta).toBeTruthy();
        expect(ta.value).toBe('А & Б');
        expect(container.querySelector('.own-field__label')?.textContent).toBe(
            'Имена',
        );
    });

    it('select → select с options', () => {
        const options = [
            { value: 'left', label: 'Слева' },
            { value: 'center', label: 'По центру' },
        ];
        const schema: ParamSchema = [
            {
                group: 'Лейаут',
                items: [
                    {
                        key: 'align',
                        label: 'Выравнивание',
                        type: 'select',
                        options,
                        def: 'center',
                    },
                ],
            },
        ];

        mount(schema, { align: 'left' });

        const sel = container.querySelector(
            'select.own-field__select',
        ) as HTMLSelectElement;
        expect(sel.value).toBe('left');
        expect([...sel.options].map((o) => o.value)).toEqual([
            'left',
            'center',
        ]);
    });

    it('color → свотч + hex-текст', () => {
        const schema: ParamSchema = [
            {
                group: 'Цвета',
                items: [
                    {
                        key: 'lineColor',
                        label: 'Цвет линии',
                        type: 'color',
                        def: '#275889',
                    },
                ],
            },
        ];

        mount(schema, { lineColor: '#aabbcc' });

        const swatch = container.querySelector(
            'input[type="color"]',
        ) as HTMLInputElement;
        const hex = container.querySelector(
            '.own-field__color input[type="text"]',
        ) as HTMLInputElement;
        expect(swatch.value).toBe('#aabbcc');
        expect(hex.value).toBe('#aabbcc');
        expect(container.querySelector('.own-field__label')?.textContent).toBe(
            'Цвет линии',
        );
    });

    it('плющит группы: все ключи схемы видны как поля', () => {
        const schema: ParamSchema = [
            {
                group: 'A',
                items: [{ key: 'a', label: 'A', type: 'text', def: '' }],
            },
            {
                group: 'B',
                items: [
                    {
                        key: 'b',
                        label: 'B',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        def: 0.5,
                        unit: '',
                    },
                    { key: 'c', label: 'C', type: 'color', def: '#000000' },
                ],
            },
        ];

        mount(schema, { a: 'x', b: 0.5, c: '#000000' });

        const titles = [
            ...container.querySelectorAll('.own-field-group__title'),
        ].map((el) => el.textContent);
        expect(titles).toEqual(['A', 'B']);
        const labels = [...container.querySelectorAll('.own-field__label')].map(
            (el) => el.textContent,
        );
        expect(labels).toEqual(['A', 'B', 'C']);
    });

    it('onChange: text → string, range → number, select → string', () => {
        const schema: ParamSchema = [
            {
                group: 'Смесь',
                items: [
                    { key: 'title', label: 'Заголовок', type: 'text', def: '' },
                    {
                        key: 'gap',
                        label: 'Отступ',
                        min: 0,
                        max: 10,
                        step: 1,
                        def: 4,
                        unit: 'px',
                    },
                    {
                        key: 'align',
                        label: 'Выравнивание',
                        type: 'select',
                        options: [
                            { value: 'left', label: 'Слева' },
                            { value: 'right', label: 'Справа' },
                        ],
                        def: 'left',
                    },
                ],
            },
        ];
        const onChange = vi.fn();
        mount(schema, { title: 'hi', gap: 4, align: 'left' }, onChange);

        const ta = container.querySelector('textarea') as HTMLTextAreaElement;
        act(() => {
            setInputValue(ta, 'hello');
        });

        const number = container.querySelector(
            'input[type="number"]',
        ) as HTMLInputElement;
        act(() => {
            setInputValue(number, '7');
        });

        const sel = container.querySelector('select') as HTMLSelectElement;
        act(() => {
            setInputValue(sel, 'right');
        });

        expect(onChange).toHaveBeenCalledWith('title', 'hello');
        expect(onChange).toHaveBeenCalledWith('gap', 7);
        expect(onChange).toHaveBeenCalledWith('align', 'right');
        for (const [, value] of onChange.mock.calls) {
            if (typeof value === 'number') {
                expect(Number.isFinite(value)).toBe(true);
            } else {
                expect(typeof value).toBe('string');
            }
        }
    });

    it('onChange: пустой number не эмитится (NaN-guard)', () => {
        const schema: ParamSchema = [
            {
                group: 'Числа',
                items: [
                    {
                        key: 'n',
                        label: 'N',
                        min: 0,
                        max: 10,
                        step: 1,
                        def: 3,
                        unit: '',
                    },
                ],
            },
        ];
        const onChange = vi.fn();
        mount(schema, { n: 3 }, onChange);

        const number = container.querySelector(
            'input[type="number"]',
        ) as HTMLInputElement;
        act(() => {
            setInputValue(number, '');
        });

        expect(onChange).not.toHaveBeenCalled();
    });
});
