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

    it('якоря data-prop на заголовке и заполненных пунктах', () => {
        expect(html).toContain('data-prop="title"');
        for (let n = 1; n <= 4; n++) {
            expect(html).toContain(`data-prop="item${n}"`);
        }
        expect(html).not.toContain('data-prop="item5"');
    });

    it('рендерит 4 пункта таймлайна (item5 пуст по умолчанию)', () => {
        const items = html.match(/<li class="s-schedule__item"/g) ?? [];
        expect(items).toHaveLength(4);
    });

    it('пустой слот не рендерит <li>', () => {
        const htmlEmpty = scheduleModule.render(
            { ...scheduleModule.defaults, item4: '' },
            stubCtx,
        );
        const items = htmlEmpty.match(/<li class="s-schedule__item"/g) ?? [];
        expect(items).toHaveLength(3);
        expect(htmlEmpty).not.toContain('data-prop="item4"');
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
