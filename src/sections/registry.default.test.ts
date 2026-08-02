import { describe, expect, it } from 'vitest';

import { defaultRegistry } from './registry.default';

describe('defaultRegistry', () => {
    it('содержит dress-code, details-faq, countdown и contacts', () => {
        const types = defaultRegistry.list().map((m) => m.type);
        expect(types).toContain('dress-code');
        expect(types).toContain('details-faq');
        expect(types).toContain('countdown');
        expect(types).toContain('contacts');
    });
});
