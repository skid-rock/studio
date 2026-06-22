import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { heroModule } from './hero';
import { closingModule } from './closing';
import { dressCodeModule } from './dress-code';
import { faqModule } from './details-faq';
import { storyModule } from './our-story';
import { scheduleModule } from './schedule';
import { countdownModule } from './countdown';
import { renderEnvelopeHtml } from './intro-envelope/markup';
import { ENVELOPE_DEFAULTS } from './intro-envelope/schema';

const stubCtx = {
    doc: {
        schemaVersion: 1,
        theme: { id: 'cream-navy' },
        motion: { preset: 'subtle' },
        sections: [],
    } satisfies StudioDocument,
};

describe('data-prop якоря (STUDIO-014)', () => {
    it('hero — три якоря с raw-содержимым', () => {
        const html = heroModule.render(heroModule.defaults, stubCtx);

        expect(html).toContain('data-prop="eyebrow"');
        expect(html).toContain('data-prop="names"');
        expect(html).toContain('data-prop="date"');
    });

    it('closing — signature и ps (литерал P.S. вне якоря)', () => {
        const html = closingModule.render(closingModule.defaults, stubCtx);

        expect(html).toContain('data-prop="signature"');
        expect(html).toContain('data-prop="ps"');
        expect(html).toContain('class="s-closing__ps-label">P.S. </span>');
        expect(html).not.toMatch(/data-prop="ps"[^>]*>P\.S\./);
    });

    it('intro-envelope — sealText помечен, deliveryText/initialsText — нет', () => {
        const html = renderEnvelopeHtml(ENVELOPE_DEFAULTS);

        expect(html).toContain('data-prop="sealText"');
        expect(html).not.toContain('data-prop="deliveryText"');
        expect(html).not.toContain('data-prop="initialsText"');
    });

    it('our-story — title и заполненные вехи (d1..d3, t1..t3)', () => {
        const html = storyModule.render(storyModule.defaults, stubCtx);

        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="d1"');
        expect(html).toContain('data-prop="t3"');
        expect(html).not.toContain('data-prop="d4"');
    });

    it('schedule — title и все 5 пар t/e', () => {
        const html = scheduleModule.render(scheduleModule.defaults, stubCtx);

        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="t1"');
        expect(html).toContain('data-prop="e5"');
    });

    it('dress-code — title и text (без data-prop на c*)', () => {
        const html = dressCodeModule.render(dressCodeModule.defaults, stubCtx);

        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="text"');
        expect(html).not.toContain('data-prop="c1"');
    });

    it('details-faq — title и заполненные пары q/a (q1..q3)', () => {
        const html = faqModule.render(faqModule.defaults, stubCtx);

        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="q1"');
        expect(html).toContain('data-prop="a3"');
        expect(html).not.toContain('data-prop="q4"');
    });

    it('countdown — якоря на подписях, target хранится в data-countdown-target', () => {
        const html = countdownModule.render(countdownModule.defaults, stubCtx);

        expect(html).toContain('data-prop="eyebrow"');
        expect(html).toContain('data-prop="lDays"');
        expect(html).toContain('data-prop="lHours"');
        expect(html).toContain('data-prop="lMinutes"');
        expect(html).toContain('data-prop="lSeconds"');
        expect(html).toContain(
            'data-countdown-target="2026-08-05T15:00:00+03:00"',
        );
        expect(html).not.toContain('data-prop="target"');
    });
});
