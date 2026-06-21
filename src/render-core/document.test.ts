import { describe, expect, it } from 'vitest';

import sampleJson from '../../examples/document.sample.json';
import {
    addSection,
    moveSection,
    removeSection,
    sortedSections,
    type StudioDocument,
} from './document';
import { parseDocument } from './document.schema';

/** Минимальный документ с одной секцией для изолированных сценариев. */
function makeSingleSectionDoc(order = 'a0'): StudioDocument {
    return {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [{ id: 'only', type: 'hero', order, props: {} }],
    };
}

describe('sortedSections', () => {
    it('сортирует секции по строковому order, независимо от порядка в массиве', () => {
        const doc = parseDocument(sampleJson);
        const shuffled: StudioDocument = {
            ...doc,
            sections: [...doc.sections].reverse(),
        };

        expect(sortedSections(shuffled).map((section) => section.id)).toEqual([
            's_intro',
            's_hero',
        ]);
    });
});

describe('addSection', () => {
    it('вставляет секцию в начало', () => {
        const doc = parseDocument(sampleJson);
        const next = addSection(
            doc,
            { id: 's_first', type: 'closing', props: {} },
            0,
        );
        const sorted = sortedSections(next);

        expect(sorted.map((section) => section.id)).toEqual([
            's_first',
            's_intro',
            's_hero',
        ]);
        expect(sorted[0].order < sorted[1].order).toBe(true);
    });

    it('вставляет секцию в середину между существующими order', () => {
        const doc = parseDocument(sampleJson);
        const next = addSection(
            doc,
            { id: 's_mid', type: 'closing', props: {} },
            1,
        );
        const sorted = sortedSections(next);
        const mid = sorted.find((section) => section.id === 's_mid');

        expect(sorted.map((section) => section.id)).toEqual([
            's_intro',
            's_mid',
            's_hero',
        ]);
        expect(mid!.order > 'a0').toBe(true);
        expect(mid!.order < 'a1').toBe(true);
    });

    it('вставляет секцию в конец по умолчанию', () => {
        const doc = parseDocument(sampleJson);
        const next = addSection(doc, {
            id: 's_last',
            type: 'closing',
            props: {},
        });
        const sorted = sortedSections(next);

        expect(sorted.map((section) => section.id)).toEqual([
            's_intro',
            's_hero',
            's_last',
        ]);
        expect(sorted[2].order > 'a1').toBe(true);
    });

    it('нормализует индекс за пределами диапазона', () => {
        const doc = makeSingleSectionDoc();
        const next = addSection(
            doc,
            { id: 's_tail', type: 'closing', props: {} },
            99,
        );
        const sorted = sortedSections(next);

        expect(sorted.map((section) => section.id)).toEqual(['only', 's_tail']);
    });

    it('не мутирует исходный документ', () => {
        const doc = parseDocument(sampleJson);
        const snapshot = JSON.stringify(doc);

        addSection(doc, { type: 'closing', props: {} }, 1);

        expect(JSON.stringify(doc)).toBe(snapshot);
    });
});

describe('moveSection', () => {
    it('перемещает секцию и пересчитывает только её order', () => {
        const doc = parseDocument(sampleJson);
        const introOrder = doc.sections.find(
            (section) => section.id === 's_intro',
        )!.order;
        const heroOrder = doc.sections.find(
            (section) => section.id === 's_hero',
        )!.order;

        const next = moveSection(doc, 's_intro', 1);
        const sorted = sortedSections(next);

        expect(sorted.map((section) => section.id)).toEqual([
            's_hero',
            's_intro',
        ]);
        expect(sorted[1].order > sorted[0].order).toBe(true);
        expect(
            next.sections.find((section) => section.id === 's_hero')!.order,
        ).toBe(heroOrder);
        expect(
            next.sections.find((section) => section.id === 's_intro')!.order,
        ).not.toBe(introOrder);
    });

    it('возвращает тот же документ, если id не найден', () => {
        const doc = parseDocument(sampleJson);
        const next = moveSection(doc, 'missing', 0);

        expect(next).toBe(doc);
    });

    it('не мутирует исходный документ', () => {
        const doc = parseDocument(sampleJson);
        const snapshot = JSON.stringify(doc);

        moveSection(doc, 's_intro', 1);

        expect(JSON.stringify(doc)).toBe(snapshot);
    });
});

describe('removeSection', () => {
    it('удаляет секцию по id', () => {
        const doc = parseDocument(sampleJson);
        const next = removeSection(doc, 's_intro');

        expect(sortedSections(next).map((section) => section.id)).toEqual([
            's_hero',
        ]);
        expect(next.sections).toHaveLength(1);
    });

    it('не мутирует исходный документ', () => {
        const doc = parseDocument(sampleJson);
        const snapshot = JSON.stringify(doc);

        removeSection(doc, 's_intro');

        expect(JSON.stringify(doc)).toBe(snapshot);
    });
});
