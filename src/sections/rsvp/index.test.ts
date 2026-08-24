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
    sectionId: 's_test',
};

describe('rsvp', () => {
    const html = rsvpModule.render(rsvpModule.defaults, stubCtx);

    it('рендерит форму с нативной HTML5-валидацией', () => {
        expect(html).toContain('<form class="s-rsvp__form" data-rsvp>');
        expect(html).toContain(
            '<input class="s-rsvp__name" type="text" name="name" autocomplete="name" placeholder="Анна Иванова" required />',
        );
        expect(html).toContain('data-rsvp-hint role="status"');
    });

    // Секция в потоке — только приглашение по макету (STUDIO-061): title, lead,
    // CTA. Формы в потоке нет, она уехала в попап.
    it('в потоке страницы держит приглашение, а анкету — в попапе', () => {
        const inFlow = html.slice(
            html.indexOf('s-rsvp__inner'),
            html.indexOf('s-rsvp-popup'),
        );

        expect(inFlow).toContain('s-rsvp__title');
        expect(inFlow).toContain('s-rsvp__lead');
        expect(inFlow).toContain('s-rsvp__open');
        expect(inFlow).not.toContain('<form');
        expect(inFlow).not.toContain('<input');
    });

    it('содержит четыре группы полей анкеты по макету', () => {
        expect(html).toContain('name="name"');
        expect(html).toContain('name="presence"');
        expect(html).toContain('name="drinks"');
        expect(html).toContain('name="menu"');
        expect(html.match(/type="radio"/g)).toHaveLength(3);
        expect(html.match(/type="checkbox"/g)).toHaveLength(10);
    });

    // ADR-0008: якорь попапа выводится из идентичности экземпляра секции
    // (ctx.sectionId), иначе два RSVP на странице поделят один id.
    it('выводит якорь попапа из sectionId контекста', () => {
        expect(html).toContain('id="rsvp-s_test"');
        expect(html).toContain('href="#rsvp-s_test"');

        const other = rsvpModule.render(rsvpModule.defaults, {
            ...stubCtx,
            sectionId: 's_other',
        });

        expect(other).toContain('id="rsvp-s_other"');
        expect(other).toContain('href="#rsvp-s_other"');
    });

    it('ставит data-prop только на редактируемые тексты', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="lead"');
        expect(html).toContain('data-prop="submit"');
        expect(html).not.toContain('data-prop="endpoint"');
        expect(html).not.toContain('data-prop="name"');
        expect(html).not.toContain('data-prop="presence"');
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
