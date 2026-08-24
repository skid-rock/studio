import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { venueModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('venue', () => {
    const html = venueModule.render(venueModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на текстовых полях', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="place"');
        expect(html).toContain('data-prop="address"');
        expect(html).toContain('data-prop="datetime"');
        expect(html).toContain('data-prop="cta"');
    });

    it('mapImage и mapUrl НЕ содержат data-prop (это атрибуты, не текст)', () => {
        expect(html).not.toContain('data-prop="mapImage"');
        expect(html).not.toContain('data-prop="mapUrl"');
    });

    it('картинка карты рендерится с loading=lazy и осмысленным alt', () => {
        expect(html).toContain('class="s-venue__map"');
        expect(html).toContain('loading="lazy"');
        expect(html).toContain('alt="Карта:');
    });

    it('ссылка кнопка имеет rel=noopener и target=_blank', () => {
        expect(html).toContain('rel="noopener"');
        expect(html).toContain('target="_blank"');
    });

    it('деградация: пустой mapImage — нет <img>', () => {
        const noImg = venueModule.render(
            { ...venueModule.defaults, mapImage: '' },
            stubCtx,
        );
        expect(noImg).not.toContain('<img');
        // ссылка-кнопка всё ещё есть
        expect(noImg).toContain('class="s-venue__cta"');
    });

    it('деградация: пустой mapUrl — нет кнопки', () => {
        const noUrl = venueModule.render(
            { ...venueModule.defaults, mapUrl: '' },
            stubCtx,
        );
        expect(noUrl).not.toContain('class="s-venue__cta"');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });

    it('не содержит <iframe или <script', () => {
        expect(html).not.toContain('<iframe');
        expect(html).not.toContain('<script');
    });

    it('тип venue есть в module.type', () => {
        expect(venueModule.type).toBe('venue');
    });
});
