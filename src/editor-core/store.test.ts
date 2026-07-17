import { describe, expect, it, vi } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { sortedSections } from '../render-core/document';
import { createRegistry } from '../render-core/registry';
import type { BlockModule } from '../render-core/types';
import { createEditorStore } from './store';

const heroSchema = [
    {
        group: 'content',
        items: [
            { type: 'text' as const, key: 'title', label: 'Title', def: 'Hero' },
            {
                type: 'text' as const,
                key: 'subtitle',
                label: 'Sub',
                def: 'Subtext',
            },
        ],
    },
];

const heroModule: BlockModule = {
    type: 'hero',
    label: 'Hero',
    schema: heroSchema,
    defaults: { title: 'Hero', subtitle: 'Subtext' },
    render: () => '<section></section>',
};

function emptyDoc(): StudioDocument {
    return {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    };
}

function docWithSections(
    sections: StudioDocument['sections'],
): StudioDocument {
    return { ...emptyDoc(), sections };
}

function makeStore(initial?: StudioDocument) {
    return createEditorStore(
        initial ?? emptyDoc(),
        createRegistry([heroModule]),
    );
}

describe('createEditorStore — команды', () => {
    it('addSection подставляет defaults из реестра', () => {
        const store = makeStore();

        store.addSection({ type: 'hero' });

        const { document: doc } = store.getState();

        expect(doc.sections).toHaveLength(1);
        expect(doc.sections[0].type).toBe('hero');
        expect(doc.sections[0].props).toEqual({
            title: 'Hero',
            subtitle: 'Subtext',
        });
    });

    it('removeSection / moveSection / duplicateSection меняют документ', () => {
        const store = makeStore(
            docWithSections([
                { id: 'a', type: 'hero', order: 'a0', props: { title: 'A' } },
                { id: 'b', type: 'hero', order: 'a1', props: { title: 'B' } },
            ]),
        );

        store.duplicateSection('a');

        const afterDup = sortedSections(store.getState().document);
        const clone = afterDup.find(
            (section) => section.id !== 'a' && section.id !== 'b',
        )!;

        expect(afterDup.map((section) => section.id)).toEqual([
            'a',
            clone.id,
            'b',
        ]);
        expect(clone.props).toEqual({ title: 'A' });

        store.moveSection(clone.id, 2);
        expect(
            sortedSections(store.getState().document).map((s) => s.id),
        ).toEqual(['a', 'b', clone.id]);

        store.removeSection('b');
        expect(
            sortedSections(store.getState().document).map((s) => s.id),
        ).toEqual(['a', clone.id]);
    });

    it('updateProps сужает props по schema блока', () => {
        const store = makeStore(
            docWithSections([
                {
                    id: 'a',
                    type: 'hero',
                    order: 'a0',
                    props: { title: 'Old', subtitle: 'Keep', junk: 1 },
                },
            ]),
        );

        store.updateProps('a', { title: 'New', junk: 2 });

        expect(store.getState().document.sections[0].props).toEqual({
            title: 'New',
            subtitle: 'Keep',
        });
    });

    it('setTheme / setThemeOverrides меняют тему', () => {
        const store = makeStore();

        store.setTheme('forest-blush');
        store.setThemeOverrides({ '--color-bg': '#111' });

        expect(store.getState().document.theme).toEqual({
            id: 'forest-blush',
            overrides: { '--color-bg': '#111' },
        });
    });
});

describe('createEditorStore — undo/redo', () => {
    it('undo/redo двигают документ; повторный commit чистит future', () => {
        const store = makeStore();

        expect(store.canUndo()).toBe(false);
        expect(store.canRedo()).toBe(false);

        store.addSection({ type: 'hero', id: 's1' });
        store.addSection({ type: 'hero', id: 's2' });

        expect(store.canUndo()).toBe(true);
        expect(store.getState().document.sections).toHaveLength(2);

        store.undo();
        expect(store.getState().document.sections.map((s) => s.id)).toEqual([
            's1',
        ]);
        expect(store.canRedo()).toBe(true);

        store.redo();
        expect(store.getState().document.sections.map((s) => s.id)).toEqual([
            's1',
            's2',
        ]);

        store.undo();
        store.addSection({ type: 'hero', id: 's3' });

        expect(store.canRedo()).toBe(false);
        expect(store.getState().document.sections.map((s) => s.id)).toEqual([
            's1',
            's3',
        ]);
    });
});

describe('createEditorStore — selection', () => {
    it('select меняет selectedId; remove сбрасывает повисший selection', () => {
        const store = makeStore(
            docWithSections([
                { id: 'a', type: 'hero', order: 'a0', props: {} },
            ]),
        );

        store.select('a');
        expect(store.getState().selectedId).toBe('a');

        store.removeSection('a');
        expect(store.getState().selectedId).toBeNull();
    });

    it('undo сбрасывает selection, если секции больше нет', () => {
        const store = makeStore();

        store.addSection({ type: 'hero', id: 's1' });
        store.select('s1');
        store.undo();

        expect(store.getState().document.sections).toHaveLength(0);
        expect(store.getState().selectedId).toBeNull();
    });
});

describe('createEditorStore — стабильность снапшота', () => {
    it('getState возвращает ту же ссылку между изменениями', () => {
        const store = makeStore();

        expect(store.getState()).toBe(store.getState());
    });

    it('команда даёт новый снапшот, но кэш стабилен до следующего изменения', () => {
        const store = makeStore();
        const before = store.getState();

        store.addSection({ type: 'hero' });

        const after = store.getState();

        expect(after).not.toBe(before);
        expect(store.getState()).toBe(after);
    });

    it('select и undo/redo тоже обновляют ссылку снапшота', () => {
        const store = makeStore();

        store.addSection({ type: 'hero', id: 's1' });

        const afterAdd = store.getState();

        store.select('s1');
        const afterSelect = store.getState();

        expect(afterSelect).not.toBe(afterAdd);

        store.undo();
        expect(store.getState()).not.toBe(afterSelect);

        const afterUndo = store.getState();

        store.redo();
        expect(store.getState()).not.toBe(afterUndo);
    });
});

describe('createEditorStore — subscribe', () => {
    it('listener вызывается на изменение; unsubscribe отписывает', () => {
        const store = makeStore();
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);

        store.addSection({ type: 'hero' });
        expect(listener).toHaveBeenCalledTimes(1);

        store.select(store.getState().document.sections[0].id);
        expect(listener).toHaveBeenCalledTimes(2);

        unsubscribe();
        store.setTheme('forest-blush');
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
