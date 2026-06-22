import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import landingSample from '../../examples/landing.sample.json';
import { parseDocument } from '../render-core/document.schema';
import { defaultRegistry } from '../sections/registry.default';
import { resolveThemeCss } from '../tokens/theme';
import { buildExportHtml, WEIGHT_BUDGET_BYTES } from './export-html';

// CSS базы холста читаем через fs (как page.test.ts) — без Vite ?raw в Node.
const baseCss = readFileSync(
    join(import.meta.dirname, '../render-core/styles/base.css'),
    'utf8',
);
const fontsCss = readFileSync(
    join(import.meta.dirname, '../render-core/styles/fonts.css'),
    'utf8',
);

describe('buildExportHtml — бюджет и полнота артефакта', () => {
    const doc = parseDocument(landingSample);
    const assets = {
        baseCss: `${baseCss}\n${fontsCss}`,
        themeCss: resolveThemeCss(doc.theme),
    };

    it('демо-лендинг (все секции) укладывается в бюджет веса', () => {
        const r = buildExportHtml(
            doc,
            defaultRegistry,
            assets,
            'Полина & Илья',
        );

        expect(r.withinBudget).toBe(true);
        expect(r.bytes).toBeLessThanOrEqual(WEIGHT_BUDGET_BYTES);
    });

    it('инлайнит client-JS секций (countdown) в <script>', () => {
        const r = buildExportHtml(doc, defaultRegistry, assets);

        // sample содержит секцию countdown → её js попадает в result.js → <script>.
        expect(r.html).toContain('<script>');
    });

    it('bytes — это UTF-8 байты (кириллица весит больше длины строки)', () => {
        const r = buildExportHtml(doc, defaultRegistry, assets);

        expect(r.bytes).toBeGreaterThan(r.html.length);
    });
});
