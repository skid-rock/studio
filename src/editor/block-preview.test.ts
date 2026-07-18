/**
 * Анти-drift: BlockPreview вставляет ровно строковый HTML mod.render
 * (STUDIO-035, перенос инварианта из удалённого adapter.test.ts).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { BlockPreview } from './block-preview';
import { renderModuleHtml } from './render-block-html';

const DOC: StudioDocument = {
    schemaVersion: 1,
    theme: { id: 'cream-navy' },
    motion: { preset: 'subtle' },
    sections: [
        {
            id: 's_hero',
            type: 'hero',
            order: 'a0',
            props: {
                eyebrow: 'Мы женимся',
                names: 'Полина & Илья',
                date: '05.08.2026',
            },
        },
    ],
};

describe('BlockPreview anti-drift', () => {
    it('HTML BlockPreview содержит ровно строковый mod.render для всех модулей', () => {
        for (const mod of defaultRegistry.list()) {
            const props = { ...mod.defaults, id: `s_${mod.type}` };
            const agnostic = renderModuleHtml(mod, props, DOC);
            const reactHtml = renderToStaticMarkup(
                createElement(BlockPreview, {
                    mod,
                    props,
                    doc: DOC,
                }),
            );

            expect(reactHtml).toContain(agnostic);
            expect(reactHtml).toMatch(
                /^<div class="editor-block" data-block="[^"]+" data-section-id="[^"]+">/,
            );
        }
    });
});
