import { describe, it, expect } from 'vitest';

import { renderEnvelopeHtml, hexToRgba } from './markup';
import { ENVELOPE_DEFAULTS } from './schema';
import { envelopeModule } from './index';
import { createRegistry, defineBlock } from '../../render-core/registry';
import { renderDocument } from '../../render-core/render';
import type { StudioDocument } from '../../render-core/document';

describe('hexToRgba', () => {
    it('разбирает #rrggbb и добавляет альфу', () => {
        expect(hexToRgba('#ffffff', 0.38)).toBe('rgba(255, 255, 255, 0.38)');
        expect(hexToRgba('#275889', 1)).toBe('rgba(39, 88, 137, 1)');
    });
});

describe('renderEnvelopeHtml', () => {
    const html = renderEnvelopeHtml(ENVELOPE_DEFAULTS);

    it('возвращает корневой .envelope-overlay с инлайновыми CSS-переменными', () => {
        expect(html).toContain('class="envelope-overlay"');
        expect(html).toContain('style=');
        expect(html).toContain('--envelope-bg:');
        expect(html).toContain(
            '--envelope-panel-fill: rgba(255, 255, 255, 0.38)',
        );
        expect(html).toContain('--envelope-flap-shift-x: clamp(');
    });

    it('рисует четыре клапана с путями d="M ..."', () => {
        const paths = html.match(/d="M [^"]+"/g) ?? [];
        expect(paths).toHaveLength(4);
    });

    it('подставляет тексты и относительный путь к печати', () => {
        expect(html).toContain('src="img/seal.png"');
        expect(html).toContain('Вам доставлено<br>приглашение');
        expect(html).toContain('П&nbsp;&amp;&nbsp;И');
        expect(html).toContain(
            '<span class="envelope__seal-text">открыть</span>',
        );
    });

    it('не содержит следов React / обращений к DOM', () => {
        expect(html).not.toMatch(/React|jsx|document\.|window\./);
    });

    it('стабилен по снапшоту на дефолтах', () => {
        expect(html).toMatchSnapshot();
    });
});

describe('envelopeModule через реестр', () => {
    it('регистрируется и доступен по типу intro/envelope', () => {
        const registry = createRegistry([defineBlock(envelopeModule)]);
        expect(registry.get('intro/envelope')).toBeDefined();
    });

    it('renderDocument выдаёт разметку конверта и его CSS', () => {
        const registry = createRegistry([defineBlock(envelopeModule)]);
        const doc: StudioDocument = {
            schemaVersion: 1,
            theme: { id: 'cream-navy' },
            motion: { preset: 'subtle' },
            sections: [
                {
                    id: 'intro',
                    type: 'intro/envelope',
                    order: 'a0',
                    props: ENVELOPE_DEFAULTS,
                },
            ],
        };

        const result = renderDocument(doc, { registry });

        expect(result.html).toContain('class="envelope-overlay"');
        expect(result.css).toContain('.envelope-overlay');
    });
});
