/**
 * STUDIO-012: ParamSchema → поля панели Puck (DoD-1 — все типы контролов).
 */
import { describe, expect, it } from 'vitest';

import type { ParamSchema } from '../render-core/schema';
import { fieldsFromSchema } from './fields-from-schema';

describe('fieldsFromSchema', () => {
    it('range без type → number с min/max/step и unit в label', () => {
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

        expect(fieldsFromSchema(schema).lineWidth).toEqual({
            type: 'number',
            label: 'Толщина линии, px',
            min: 0,
            max: 4,
            step: 0.25,
        });
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

        expect(fieldsFromSchema(schema).tipLength).toEqual({
            type: 'number',
            label: 'Длина дуги',
            min: 0,
            max: 15,
            step: 0.1,
        });
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

        expect(fieldsFromSchema(schema).names).toEqual({
            type: 'textarea',
            label: 'Имена',
        });
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

        expect(fieldsFromSchema(schema).align).toEqual({
            type: 'select',
            label: 'Выравнивание',
            options,
        });
    });

    it('color → custom с render', () => {
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

        const field = fieldsFromSchema(schema).lineColor;
        expect(field.type).toBe('custom');
        if (field.type !== 'custom') {
            throw new Error('ожидалось custom-поле');
        }
        expect(field.label).toBe('Цвет линии');
        expect(typeof field.render).toBe('function');
    });

    it('плющит группы в плоский Record по key', () => {
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
                    { key: 'c', label: 'C', type: 'color', def: '#000' },
                ],
            },
        ];

        const fields = fieldsFromSchema(schema);
        expect(Object.keys(fields).sort()).toEqual(['a', 'b', 'c']);
    });
});
