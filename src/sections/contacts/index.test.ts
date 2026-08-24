import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { contactsModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('contacts', () => {
    const html = contactsModule.render(contactsModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на тексте и подписи кнопки, но не на путях', () => {
        expect(html).toContain('data-prop="text"');
        expect(html).toContain('data-prop="ctaLabel"');
        expect(html).not.toContain('data-prop="ctaUrl"');
        expect(html).not.toContain('data-prop="decorImg"');
    });

    it('ссылка-кнопка имеет rel=noopener и target=_blank', () => {
        expect(html).toContain('<a class="s-contacts__cta"');
        expect(html).toContain('rel="noopener"');
        expect(html).toContain('target="_blank"');
    });

    it('декор рендерится с loading=lazy и пустым alt', () => {
        expect(html).toContain('class="s-contacts__decor"');
        expect(html).toContain('loading="lazy"');
        expect(html).toContain('alt=""');
        expect(html).toContain('aria-hidden="true"');
    });

    it('кнопка без ссылки деградирует до span, без подписи — не рендерится', () => {
        const noUrl = contactsModule.render(
            { ...contactsModule.defaults, ctaUrl: '' },
            stubCtx,
        );
        expect(noUrl).toContain('<span class="s-contacts__cta"');
        expect(noUrl).not.toContain('<a class="s-contacts__cta"');

        const noLabel = contactsModule.render(
            { ...contactsModule.defaults, ctaLabel: '' },
            stubCtx,
        );
        expect(noLabel).not.toContain('s-contacts__cta');
    });

    it('деградация: пустой text — нет абзаца', () => {
        const noText = contactsModule.render(
            { ...contactsModule.defaults, text: '' },
            stubCtx,
        );
        expect(noText).not.toContain('s-contacts__text');
    });

    it('деградация: пустой decorImg — нет <img>', () => {
        const noDecor = contactsModule.render(
            { ...contactsModule.defaults, decorImg: '' },
            stubCtx,
        );
        expect(noDecor).not.toContain('<img');
    });

    it('экранирует кавычки в значениях, попадающих в атрибуты', () => {
        const injected = contactsModule.render(
            {
                ...contactsModule.defaults,
                decorImg: '/img/x.png" onerror="alert(1)',
            },
            stubCtx,
        );
        expect(injected).not.toContain('onerror="alert(1)"');
        expect(injected).toContain('&quot;');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });

    it('тип contacts есть в module.type', () => {
        expect(contactsModule.type).toBe('contacts');
    });
});
