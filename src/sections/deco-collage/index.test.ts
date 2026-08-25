import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { decoCollageModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('deco-collage', () => {
    const html = decoCollageModule.render(
        decoCollageModule.defaults,
        stubCtx,
    );

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('тип deco-collage в module.type', () => {
        expect(decoCollageModule.type).toBe('deco-collage');
    });

    it('фото с CSS-классами поворота и object-fit cover', () => {
        expect(html).toContain('s-dc__photo--left');
        expect(html).toContain('s-dc__photo--right');
        expect(decoCollageModule.css).toContain('rotate(11deg)');
        expect(decoCollageModule.css).toContain('rotate(-7deg)');
        expect(decoCollageModule.css).toContain('object-fit: cover');
    });

    it('тень ровно на пяти узлах', () => {
        // Пять узлов: stage, оба фото (общий класс .s-dc__photo), pearl-a, pearl-b.
        // Правил CSS с box-shadow два — stage и общее правило фото; у жемчужин
        // тень через filter: drop-shadow (идёт по альфе круглого PNG),
        // у rings тени в макете нет.
        const css = decoCollageModule.css ?? '';
        const shadowRules =
            css.split('box-shadow: var(--shadow-photo)').length - 1;
        expect(shadowRules).toBe(2);
        expect(css).toContain('drop-shadow(0 1px 2px rgba(102, 92, 92, 0.25))');
        expect(html).toContain('s-dc__stage');
        expect((html.match(/class="s-dc__photo /g) ?? []).length).toBe(2);
        expect(html).toContain('s-dc__deco--pearl-a');
        expect(html).toContain('s-dc__deco--pearl-b');
    });

    it('зашитый декор рендерится с lazy и aria-hidden', () => {
        expect(html).toContain('/img/deco-collage/pearl-a.png');
        expect(html).toContain('/img/deco-collage/rings.png');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('loading="lazy"');
    });

    it('деградация: пустые фото — нет img фото, паспарту остаётся', () => {
        const noPhotos = decoCollageModule.render(
            {
                ...decoCollageModule.defaults,
                photoLeft: '',
                photoRight: '',
            },
            stubCtx,
        );
        expect(noPhotos).not.toContain('s-dc__img');
        expect(noPhotos).toContain('s-dc__photo--left');
        expect(noPhotos).toContain('s-dc__photo--right');
        // deco остаётся
        expect(noPhotos).toContain('s-dc__deco--rings');
    });

    it('экранирует кавычки в src фото', () => {
        const injected = decoCollageModule.render(
            {
                ...decoCollageModule.defaults,
                photoLeft: '/img/x.png" onerror="alert(1)',
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
