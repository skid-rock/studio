import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../../render-core/document';
import { countdownModule } from './index';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('countdown', () => {
    const html = countdownModule.render(countdownModule.defaults, stubCtx);

    it('рендерит корневые countdown-атрибуты', () => {
        expect(html).toContain('data-countdown-root');
        expect(html).toContain('data-countdown-target="2026-08-05T15:00:00+03:00"');
    });

    it('содержит 4 ячейки времени и подписи', () => {
        expect(html).toContain('data-countdown="days"');
        expect(html).toContain('data-countdown="hours"');
        expect(html).toContain('data-countdown="minutes"');
        expect(html).toContain('data-countdown="seconds"');
        expect(html).toContain('data-prop="lDays"');
        expect(html).toContain('data-prop="lSeconds"');
    });

    it('экспортирует css и js контракта секции', () => {
        expect(countdownModule.css).toContain('.s-countdown');
        expect(countdownModule.js).toContain('[data-countdown-root]');
        expect(countdownModule.js).toContain('__cdTimer');
    });

    it('render остаётся агностичным к React', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });
});
