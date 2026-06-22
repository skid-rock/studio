import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { rsvpModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('rsvp', () => {
    const html = rsvpModule.render(rsvpModule.defaults, stubCtx);

    it('рендерит форму с нативной HTML5-валидацией', () => {
        expect(html).toContain('<form class="s-rsvp__form" data-rsvp>');
        expect(html).toContain(
            '<input type="text" name="name" autocomplete="name" required />',
        );
        expect(html).toContain(
            '<input type="radio" name="attend" value="yes" checked /> Да, с удовольствием',
        );
        expect(html).toContain(
            '<input type="radio" name="attend" value="no" /> К сожалению, нет',
        );
        expect(html).toContain('name="drinks"');
        expect(html).toContain('data-rsvp-hint role="status"');
    });

    it('ставит data-prop только на редактируемые тексты', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="lead"');
        expect(html).toContain('data-prop="submit"');
        expect(html).not.toContain('data-prop="endpoint"');
        expect(html).not.toContain('data-prop="name"');
        expect(html).not.toContain('data-prop="attend"');
        expect(html).not.toContain('data-prop="drinks"');
    });

    it('в демо-режиме не добавляет action и method', () => {
        expect(html).toContain('<form class="s-rsvp__form" data-rsvp>');
        expect(html).not.toContain(' action=');
        expect(html).not.toContain(' method=');
    });

    it('обозначает точку подключения бэкенда через endpoint', () => {
        const htmlWithEndpoint = rsvpModule.render(
            {
                ...rsvpModule.defaults,
                endpoint: 'https://example.test/rsvp?utm="guest"',
            },
            stubCtx,
        );

        expect(htmlWithEndpoint).toContain(
            'action="https://example.test/rsvp?utm=&quot;guest&quot;" method="post"',
        );
    });

    it('поставляет идемпотентный клиентский скрипт демо-submit', () => {
        expect(rsvpModule.js).toContain(
            "document.querySelectorAll('form[data-rsvp]')",
        );
        expect(rsvpModule.js).toContain("data-rsvp-init','1'");
        expect(rsvpModule.js).toContain('данные не сохраняются');
        expect(rsvpModule.js).toContain('Если action задан');
    });

    it('не содержит следов React / обращений к DOM в render', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
