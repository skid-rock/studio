import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { dressCodeModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
    sectionId: 's_test',
};

describe('dress-code', () => {
    const html = dressCodeModule.render(dressCodeModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на title и text', () => {
        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="text"');
        expect(html).not.toContain('data-prop="c1"');
    });

    it('пустой образец c4 не рендерит swatch', () => {
        const swatches = html.match(/<span class="s-dress__swatch"/g) ?? [];
        expect(swatches).toHaveLength(3);
    });

    it('все пустые образцы — палитра не рендерится', () => {
        const htmlEmpty = dressCodeModule.render(
            { ...dressCodeModule.defaults, c1: '', c2: '', c3: '', c4: '' },
            stubCtx,
        );
        expect(htmlEmpty).not.toContain('s-dress__palette');
        expect(htmlEmpty).not.toContain('s-dress__swatch');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
