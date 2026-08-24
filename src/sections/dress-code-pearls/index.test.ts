import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { dressCodePearlsModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'marine' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('dress-code-pearls', () => {
    const html = dressCodePearlsModule.render(
        dressCodePearlsModule.defaults,
        stubCtx,
    );

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на текстовых узлах, но не на путях к картинкам', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="text"');
        expect(html).toContain('data-prop="p1cap"');
        expect(html).toContain('data-prop="contactText"');
        expect(html).toContain('data-prop="ctaLabel"');
        expect(html).not.toContain('data-prop="p1img"');
        expect(html).not.toContain('data-prop="photo"');
    });

    it('на дефолтах рендерит 4 образца палитры', () => {
        const swatches = html.match(/<div class="s-dcp__swatch">/g) ?? [];
        expect(swatches).toHaveLength(4);
    });

    it('пустой образец (и картинка, и подпись) не рендерится', () => {
        const partial = dressCodePearlsModule.render(
            { ...dressCodePearlsModule.defaults, p4img: '', p4cap: '' },
            stubCtx,
        );
        const swatches = partial.match(/<div class="s-dcp__swatch">/g) ?? [];
        expect(swatches).toHaveLength(3);
    });

    it('без картинок и подписей палитра не рендерится вовсе', () => {
        const empty = dressCodePearlsModule.render(
            {
                ...dressCodePearlsModule.defaults,
                p1img: '',
                p1cap: '',
                p2img: '',
                p2cap: '',
                p3img: '',
                p3cap: '',
                p4img: '',
                p4cap: '',
            },
            stubCtx,
        );
        expect(empty).not.toContain('s-dcp__palette');
        expect(empty).not.toContain('s-dcp__swatch');
    });

    it('кнопка без ссылки деградирует до span, без подписи — не рендерится', () => {
        const noUrl = dressCodePearlsModule.render(
            { ...dressCodePearlsModule.defaults, ctaUrl: '' },
            stubCtx,
        );
        expect(noUrl).toContain('<span class="s-dcp__cta"');
        expect(noUrl).not.toContain('<a class="s-dcp__cta"');

        const noLabel = dressCodePearlsModule.render(
            { ...dressCodePearlsModule.defaults, ctaLabel: '' },
            stubCtx,
        );
        expect(noLabel).not.toContain('s-dcp__cta');
    });

    it('без фото не рендерится ни карточка, ни декор поверх неё', () => {
        const noPhoto = dressCodePearlsModule.render(
            { ...dressCodePearlsModule.defaults, photo: '' },
            stubCtx,
        );
        expect(noPhoto).not.toContain('s-dcp__card');
        expect(noPhoto).not.toContain('s-dcp__decor');
    });

    it('экранирует кавычки в значениях, попадающих в атрибуты', () => {
        const injected = dressCodePearlsModule.render(
            {
                ...dressCodePearlsModule.defaults,
                photo: '/img/x.jpg" onerror="alert(1)',
            },
            stubCtx,
        );
        expect(injected).not.toContain('onerror="alert(1)"');
        expect(injected).toContain('&quot;');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
