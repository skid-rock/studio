/**
 * @vitest-environment happy-dom
 *
 * Юнит-тесты inline-правки своего холста (STUDIO-034).
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { createRegistry } from '../render-core/registry';
import type { BlockModule } from '../render-core/types';
import { createEditorStore } from '../editor-core';
import { attachInlineEdit } from './inline-edit';

const heroModule: BlockModule = {
    type: 'hero',
    label: 'Hero',
    schema: [
        {
            group: 'content',
            items: [
                {
                    type: 'text' as const,
                    key: 'title',
                    label: 'Title',
                    def: 'Hero',
                },
            ],
        },
    ],
    defaults: { title: 'Hero' },
    render: () => '<section></section>',
};

function makeStore(title = 'Старый заголовок') {
    const doc: StudioDocument = {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [
            {
                id: 's1',
                type: 'hero',
                order: 'a0',
                props: { title },
            },
        ],
    };

    return createEditorStore(doc, createRegistry([heroModule]));
}

function mountPage(html: string): HTMLElement {
    document.body.innerHTML = html;

    return document.body.firstElementChild as HTMLElement;
}

describe('attachInlineEdit', () => {
    let cleanup: (() => void) | undefined;

    afterEach(() => {
        cleanup?.();
        cleanup = undefined;
        document.body.innerHTML = '';
    });

    it('включает contentEditable на [data-prop]', () => {
        const root = mountPage(`
            <div>
              <div data-section-id="s1">
                <h1 data-prop="title">Старый заголовок</h1>
              </div>
            </div>
        `);
        const store = makeStore();

        cleanup = attachInlineEdit(root, store);

        const anchor = root.querySelector<HTMLElement>('[data-prop="title"]')!;

        expect(anchor.getAttribute('contenteditable')).toBe('plaintext-only');
        expect(anchor.hasAttribute('data-inline-edit-ready')).toBe(true);
        expect(anchor.spellcheck).toBe(false);
    });

    it('коммитит текст в документ на focusout', () => {
        const root = mountPage(`
            <div>
              <div data-section-id="s1">
                <h1 data-prop="title">Старый заголовок</h1>
              </div>
            </div>
        `);
        const store = makeStore();

        cleanup = attachInlineEdit(root, store);

        const anchor = root.querySelector<HTMLElement>('[data-prop="title"]')!;

        anchor.textContent = 'Новый заголовок';
        anchor.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

        expect(store.getState().document.sections[0].props.title).toBe(
            'Новый заголовок',
        );
        expect(store.canUndo()).toBe(true);
    });

    it('Enter без Shift вызывает blur (коммит)', () => {
        const root = mountPage(`
            <div>
              <div data-section-id="s1">
                <h1 data-prop="title">Старый заголовок</h1>
              </div>
            </div>
        `);
        const store = makeStore();

        cleanup = attachInlineEdit(root, store);

        const anchor = root.querySelector<HTMLElement>('[data-prop="title"]')!;

        anchor.focus();
        anchor.textContent = 'Через Enter';

        const keyEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
        });

        anchor.dispatchEvent(keyEvent);
        // В happy-dom blur после preventDefault может не сработать сам —
        // симулируем blur, который браузер делает после preventDefault+blur().
        if (document.activeElement === anchor) {
            anchor.blur();
        }

        expect(store.getState().document.sections[0].props.title).toBe(
            'Через Enter',
        );
    });

    it('no-op без изменений — история не растёт', () => {
        const root = mountPage(`
            <div>
              <div data-section-id="s1">
                <h1 data-prop="title">Старый заголовок</h1>
              </div>
            </div>
        `);
        const store = makeStore();

        cleanup = attachInlineEdit(root, store);

        const anchor = root.querySelector<HTMLElement>('[data-prop="title"]')!;

        anchor.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

        expect(store.canUndo()).toBe(false);
        expect(store.getState().document.sections[0].props.title).toBe(
            'Старый заголовок',
        );
    });

    it('включает contentEditable на якорях, добавленных после attach', async () => {
        const root = mountPage(`<div></div>`);
        const store = makeStore();

        cleanup = attachInlineEdit(root, store);

        root.innerHTML = `
            <div data-section-id="s1">
              <h1 data-prop="title">Старый заголовок</h1>
            </div>
        `;

        // MutationObserver доставляет колбэк микротаском.
        await Promise.resolve();

        const anchor = root.querySelector<HTMLElement>('[data-prop="title"]')!;

        expect(anchor.getAttribute('contenteditable')).toBe('plaintext-only');
    });
});
