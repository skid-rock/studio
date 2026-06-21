import { describe, expect, it } from 'vitest';

import type { StudioDocument } from '../render-core/document';
import { heroModule } from './hero';
import { closingModule } from './closing';
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
});
