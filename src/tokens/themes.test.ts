import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
    DEFAULT_THEME_ID,
    THEMES,
    appendOverridesCss,
    resolveCssVar,
    themeById,
} from './themes';

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

    it.each(THEMES)(
        'dist/$id.css существует и содержит ключевые переменные',
        ({ id }) => {
            const css = readFileSync(join(DIST_DIR, `${id}.css`), 'utf8');

            expect(css).toContain(':root {');
            for (const needle of KEY_VARS) {
                expect(css).toContain(needle);
            }
        },
    );
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

describe('appendOverridesCss', () => {
    const base = ':root {\n  --color-navy: #275889;\n}';

    it('без оверрайдов возвращает baseCss без изменений', () => {
        expect(appendOverridesCss(base)).toBe(base);
        expect(appendOverridesCss(base, {})).toBe(base);
    });

    it('дописывает хвост :root с оверрайдами', () => {
        const out = appendOverridesCss(base, { '--color-navy': '#000088' });

        expect(out.startsWith(base)).toBe(true);
        expect(out).toContain(':root {\n  --color-navy: #000088;\n}');
    });

    it('нормализует ключ без префикса --', () => {
        const out = appendOverridesCss(base, { 'color-cream': '#fff' });

        expect(out).toContain('  --color-cream: #fff;');
    });
});

describe('resolveCssVar', () => {
    const css = [
        ':root {',
        '  --color-navy: #275889;',
        '  --color-text: var(--color-navy);',
        '  --font-body: "Inter", sans-serif;',
        '}',
    ].join('\n');

    it('читает прямое значение переменной', () => {
        expect(resolveCssVar(css, '--color-navy')).toBe('#275889');
    });

    it('резолвит алиас var(--other) до конечного значения', () => {
        expect(resolveCssVar(css, '--color-text')).toBe('#275889');
    });

    it('возвращает строковое значение шрифта как есть', () => {
        expect(resolveCssVar(css, '--font-body')).toBe('"Inter", sans-serif');
    });

    it('принимает имя без префикса --', () => {
        expect(resolveCssVar(css, 'color-navy')).toBe('#275889');
    });

    it('undefined для отсутствующей переменной', () => {
        expect(resolveCssVar(css, '--nope')).toBeUndefined();
    });

    it('не зацикливается на циклической ссылке', () => {
        const loop = ':root {\n  --a: var(--b);\n  --b: var(--a);\n}';

        expect(resolveCssVar(loop, '--a')).toBeUndefined();
    });
});
