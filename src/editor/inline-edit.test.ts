/**
 * Юнит-тесты edit-time write-back (STUDIO-015): чистая логика applyInlineEdit.
 */
import { describe, expect, it } from 'vitest';

import type { Data } from '@measured/puck';

import { applyInlineEdit } from './inline-edit-logic';

const DATA: Data = {
    root: { props: {} },
    content: [
        {
            type: 'hero',
            props: {
                id: 's_hero',
                eyebrow: 'Мы женимся',
                names: 'Полина & Илья',
                date: '05.08.2026',
            },
        },
        {
            type: 'closing',
            props: {
                id: 's_closing',
                signature: 'С любовью',
                ps: 'Будем рады!',
            },
        },
    ],
};

describe('applyInlineEdit', () => {
    it('обновляет prop узла по sectionId', () => {
        const patch = applyInlineEdit(DATA, 's_hero', 'names', 'Аня & Боря');

        expect(patch.content).toHaveLength(2);
        const hero = patch.content!.find(
            (c) => (c.props as { id?: string }).id === 's_hero',
        );
        expect(hero?.props.names).toBe('Аня & Боря');
        expect(hero?.props.eyebrow).toBe('Мы женимся');
    });

    it('no-op, если значение не изменилось', () => {
        const patch = applyInlineEdit(DATA, 's_hero', 'names', 'Полина & Илья');

        expect(patch).toEqual({});
    });

    it('no-op, если узел не найден', () => {
        const patch = applyInlineEdit(DATA, 'missing', 'names', 'X');

        expect(patch).toEqual({});
    });

    it('не трогает соседние узлы', () => {
        const patch = applyInlineEdit(DATA, 's_closing', 'ps', 'Новый P.S.');

        const hero = patch.content!.find(
            (c) => (c.props as { id?: string }).id === 's_hero',
        );
        expect(hero?.props.names).toBe('Полина & Илья');
    });
});
