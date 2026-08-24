import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { heroModule } from './hero';
import { closingModule } from './closing';
import { closingCollageModule } from './closing-collage';
import { contactsModule } from './contacts';
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
    sectionId: 's_test',
};

describe('data-prop якоря (STUDIO-014)', () => {
    it('hero — якоря на текстах, но не на URL фото', () => {
        const html = heroModule.render(heroModule.defaults, stubCtx);

        expect(html).toContain('data-prop="name1"');
        expect(html).toContain('data-prop="ampersand"');
        expect(html).toContain('data-prop="name2"');
        expect(html).toContain('data-prop="eyebrow"');
        expect(html).toContain('data-prop="message"');
        expect(html).toContain('data-prop="date"');
        expect(html).not.toContain('data-prop="photoUrl"');
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

    it('schedule — title и заполненные item*', () => {
        const html = scheduleModule.render(scheduleModule.defaults, stubCtx);

        expect(html).toContain('data-prop="title"');
        expect(html).toContain('data-prop="item1"');
        expect(html).toContain('data-prop="item4"');
        expect(html).not.toContain('data-prop="item5"');
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

    it('contacts — text и ctaLabel (без data-prop на ctaUrl/decorImg)', () => {
        const html = contactsModule.render(contactsModule.defaults, stubCtx);

        expect(html).toContain('data-prop="text"');
        expect(html).toContain('data-prop="ctaLabel"');
        expect(html).not.toContain('data-prop="ctaUrl"');
        expect(html).not.toContain('data-prop="decorImg"');
    });

    it('closing-collage — буквы монограммы (без data-prop на путях фото)', () => {
        const html = closingCollageModule.render(
            closingCollageModule.defaults,
            stubCtx,
        );

        expect(html).toContain('data-prop="letterLeft"');
        expect(html).toContain('data-prop="amp"');
        expect(html).toContain('data-prop="letterRight"');
        expect(html).not.toContain('data-prop="photoLeft"');
        expect(html).not.toContain('data-prop="photoRight"');
    });
});
