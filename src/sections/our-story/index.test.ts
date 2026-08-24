import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { storyModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('our-story', () => {
    const html = storyModule.render(storyModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на заголовке и заполненных слотах', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="d1"');
        expect(html).toContain('data-prop="t1"');
        expect(html).toContain('data-prop="d2"');
        expect(html).toContain('data-prop="t2"');
        expect(html).toContain('data-prop="d3"');
        expect(html).toContain('data-prop="t3"');
        expect(html).not.toContain('data-prop="d4"');
        expect(html).not.toContain('data-prop="t4"');
    });

    it('пустой слот 4 не рендерит <li>', () => {
        const items = html.match(/<li class="s-story__item">/g) ?? [];
        expect(items).toHaveLength(3);
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
