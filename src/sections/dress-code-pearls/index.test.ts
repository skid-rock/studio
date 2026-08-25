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
    sectionId: 's_test',
};

const schemaKeys = dressCodePearlsModule.schema.flatMap((g) =>
    g.items.map((item) => item.key),
);

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
        expect(html).toContain('data-prop="subtitle"');
        expect(html).toContain('data-prop="p1cap"');
        expect(html).toContain('data-prop="p5cap"');
        expect(html).toContain('data-prop="womenTitle"');
        expect(html).toContain('data-prop="womenText"');
        expect(html).toContain('data-prop="menTitle"');
        expect(html).toContain('data-prop="menText"');
        expect(html).not.toContain('data-prop="p1img"');
        expect(html).not.toContain('data-prop="p5img"');
    });

    it('на дефолтах рендерит 5 образцов палитры', () => {
        const swatches = html.match(/<div class="s-dcp__swatch">/g) ?? [];
        expect(swatches).toHaveLength(5);
    });

    it('пустой образец (и картинка, и подпись) не рендерится', () => {
        const partial = dressCodePearlsModule.render(
            { ...dressCodePearlsModule.defaults, p5img: '', p5cap: '' },
            stubCtx,
        );
        const swatches = partial.match(/<div class="s-dcp__swatch">/g) ?? [];
        expect(swatches).toHaveLength(4);
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
                p5img: '',
                p5cap: '',
            },
            stubCtx,
        );
        expect(empty).not.toContain('s-dcp__palette');
        expect(empty).not.toContain('s-dcp__swatch');
    });

    it('пустая группа attire не рендерится, блок без обеих групп исчезает', () => {
        const noWomen = dressCodePearlsModule.render(
            {
                ...dressCodePearlsModule.defaults,
                womenTitle: '',
                womenText: '',
            },
            stubCtx,
        );
        expect(noWomen).toContain('s-dcp__attire');
        expect(noWomen).toContain('data-prop="menTitle"');
        expect(noWomen).not.toContain('data-prop="womenTitle"');
        expect(noWomen).not.toContain('data-prop="womenText"');

        const noAttire = dressCodePearlsModule.render(
            {
                ...dressCodePearlsModule.defaults,
                womenTitle: '',
                womenText: '',
                menTitle: '',
                menText: '',
            },
            stubCtx,
        );
        expect(noAttire).not.toContain('s-dcp__attire');
        expect(noAttire).not.toContain('s-dcp__group');
    });

    it('выпиленных полей нет ни в схеме, ни в разметке', () => {
        const removed = [
            'contactText',
            'ctaLabel',
            'ctaUrl',
            'photo',
            'photoAlt',
            'decorImg',
        ];

        for (const key of removed) {
            expect(schemaKeys).not.toContain(key);
            expect(html).not.toContain(`data-prop="${key}"`);
        }

        expect(html).not.toContain('s-dcp__contact');
        expect(html).not.toContain('s-dcp__cta');
        expect(html).not.toContain('s-dcp__card');
        expect(html).not.toContain('s-dcp__photo');
        expect(html).not.toContain('s-dcp__decor');
    });

    it('экранирует кавычки в значениях, попадающих в атрибуты', () => {
        const injected = dressCodePearlsModule.render(
            {
                ...dressCodePearlsModule.defaults,
                p1img: '/img/x.png" onerror="alert(1)',
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
