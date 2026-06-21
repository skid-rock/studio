import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { scheduleModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('schedule', () => {
    const html = scheduleModule.render(scheduleModule.defaults, stubCtx);

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });

    it('якоря data-prop на заголовке и всех 5 пунктах', () => {
        expect(html).toContain('data-prop="title"');
        for (let n = 1; n <= 5; n++) {
            expect(html).toContain(`data-prop="t${n}"`);
            expect(html).toContain(`data-prop="e${n}"`);
        }
    });

    it('рендерит 5 пунктов таймлайна', () => {
        const items = html.match(/<li class="s-schedule__item">/g) ?? [];
        expect(items).toHaveLength(5);
    });

    it('пустой слот не рендерит <li>', () => {
        const htmlEmpty = scheduleModule.render(
            { ...scheduleModule.defaults, t5: '', e5: '' },
            stubCtx,
        );
        const items = htmlEmpty.match(/<li class="s-schedule__item">/g) ?? [];
        expect(items).toHaveLength(4);
        expect(htmlEmpty).not.toContain('data-prop="t5"');
        expect(htmlEmpty).not.toContain('data-prop="e5"');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
