import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_ID, THEMES, themeById } from './themes';

const DIST_DIR = join(dirname(fileURLToPath(import.meta.url)), 'dist');

/** Ключевые переменные, общие для всех тем (контракт секций). */
const KEY_VARS = [
    '--color-cream:',
    '--color-navy:',
    '--color-text:',
    '--font-display:',
    '--font-body:',
] as const;

describe('реестр THEMES', () => {
    it('содержит ≥3 курированных тем', () => {
        expect(THEMES.length).toBeGreaterThanOrEqual(3);
    });

    it.each(THEMES)('dist/$id.css существует и содержит ключевые переменные', ({ id }) => {
        const css = readFileSync(join(DIST_DIR, `${id}.css`), 'utf8');

        expect(css).toContain(':root {');
        for (const needle of KEY_VARS) {
            expect(css).toContain(needle);
        }
    });
});

describe('themeById', () => {
    const map: Record<string, string> = {
        'cream-navy': 'css-a',
        'forest-blush': 'css-b',
    };

    it('возвращает значение для известной темы', () => {
        expect(themeById(map, 'forest-blush')).toBe('css-b');
    });

    it('фолбэк на дефолтную тему для неизвестного id', () => {
        expect(themeById(map, 'unknown-theme')).toBe(map[DEFAULT_THEME_ID]);
    });
});
