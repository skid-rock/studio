import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { faqModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('details-faq', () => {
    const html = faqModule.render(faqModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на заголовке и заполненных слотах', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="q1"');
        expect(html).toContain('data-prop="a1"');
        expect(html).toContain('data-prop="q3"');
        expect(html).toContain('data-prop="a3"');
        expect(html).not.toContain('data-prop="q4"');
        expect(html).not.toContain('data-prop="a4"');
    });

    it('пустой слот 4 не рендерит item', () => {
        const items = html.match(/<div class="s-faq__item">/g) ?? [];
        expect(items).toHaveLength(3);
    });

    it('пустой средний слот сохраняет нумерацию якорей', () => {
        const htmlGap = faqModule.render(
            { ...faqModule.defaults, q2: '', a2: '' },
            stubCtx,
        );
        expect(htmlGap).not.toContain('data-prop="q2"');
        expect(htmlGap).toContain('data-prop="q3"');
        expect(htmlGap).toContain('data-prop="a3"');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
