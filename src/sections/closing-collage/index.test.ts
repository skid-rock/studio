import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { closingCollageModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('closing-collage', () => {
    const html = closingCollageModule.render(
        closingCollageModule.defaults,
        stubCtx,
    );

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('тип closing-collage в module.type', () => {
        expect(closingCollageModule.type).toBe('closing-collage');
    });

    it('якоря data-prop на буквах монограммы, не на путях фото', () => {
        expect(html).toContain('data-prop="letterLeft"');
        expect(html).toContain('data-prop="amp"');
        expect(html).toContain('data-prop="letterRight"');
        expect(html).not.toContain('data-prop="photoLeft"');
        expect(html).not.toContain('data-prop="photoRight"');
    });

    it('фото с CSS-классами поворота и object-fit cover', () => {
        expect(html).toContain('s-cc__photo--left');
        expect(html).toContain('s-cc__photo--right');
        expect(closingCollageModule.css).toContain('rotate(11.396deg)');
        expect(closingCollageModule.css).toContain('rotate(-6.878deg)');
        expect(closingCollageModule.css).toContain('object-fit: cover');
    });

    it('зашитый декор рендерится с lazy и aria-hidden', () => {
        expect(html).toContain('/img/closing-collage/pearl-a.png');
        expect(html).toContain('/img/closing-collage/shell.png');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('loading="lazy"');
    });

    it('деградация: пустые фото — нет img фото', () => {
        const noPhotos = closingCollageModule.render(
            {
                ...closingCollageModule.defaults,
                photoLeft: '',
                photoRight: '',
            },
            stubCtx,
        );
        expect(noPhotos).not.toContain('s-cc__photo--left');
        expect(noPhotos).not.toContain('s-cc__photo--right');
        // deco остаётся
        expect(noPhotos).toContain('s-cc__deco--shell');
    });

    it('деградация: пустая буква — нет span с якорем', () => {
        const noAmp = closingCollageModule.render(
            { ...closingCollageModule.defaults, amp: '' },
            stubCtx,
        );
        expect(noAmp).not.toContain('data-prop="amp"');
        expect(noAmp).toContain('data-prop="letterLeft"');
    });

    it('экранирует кавычки в src фото', () => {
        const injected = closingCollageModule.render(
            {
                ...closingCollageModule.defaults,
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
