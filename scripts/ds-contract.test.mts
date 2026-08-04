/**
 * Контракт эталона ДС: чистые функции без ФС (STUDIO-051).
 *
 * Фикстуры «совпали» / «разошлись» — автотест DoD, не только ручной прогон.
 */
import { describe, expect, it } from 'vitest';

import {
    classesFromCss,
    classesFromSource,
    classesFromTemplate,
    compare,
} from './ds-contract.mts';

describe('classesFromTemplate', () => {
    it('берёт ch-* и is-*, игнорирует прочие классы', () => {
        const html =
            '<div class="ch-panel is-selected my-panel foo">' +
            '<span class="ch-tile"></span></div>';

        expect([...classesFromTemplate(html)].sort()).toEqual([
            'ch-panel',
            'ch-tile',
            'is-selected',
        ]);
    });
});

describe('classesFromCss', () => {
    it('снимает имена из селекторов .ch-* / .is-*', () => {
        const css = '.ch-panel{}.ch-panel.is-open{}.foo{}';

        expect([...classesFromCss(css)].sort()).toEqual(['ch-panel', 'is-open']);
    });
});

describe('classesFromSource', () => {
    it('снимает класс из обычной строки', () => {
        expect([...classesFromSource(`className="ch-panel"`)]).toEqual([
            'ch-panel',
        ]);
    });

    it('снимает из шаблонного литерала со вставкой', () => {
        const src = 'className={`ch-block-card ${x ? "is-selected" : ""}`}';

        expect([...classesFromSource(src)].sort()).toEqual([
            'ch-block-card',
            'is-selected',
        ]);
    });

    it('снимает из массива литералов', () => {
        const src = `['ch-cv-section', isSel && 'is-selected', 'ch-bleed']`;

        expect([...classesFromSource(src)].sort()).toEqual([
            'ch-bleed',
            'ch-cv-section',
            'is-selected',
        ]);
    });

    it('не берёт класс из комментария', () => {
        const src = `// className="ch-ghost"\nclassName="ch-panel"`;

        expect([...classesFromSource(src)]).toEqual(['ch-panel']);
    });

    it('не режет // внутри URL', () => {
        const src = `const u = "https://example.com/ch-panel"; className="ch-tile"`;

        expect([...classesFromSource(src)].sort()).toEqual([
            'ch-panel',
            'ch-tile',
        ]);
    });
});

describe('compare', () => {
    it('совпали → пустой массив', () => {
        const set = new Set(['ch-panel', 'is-selected']);

        expect(compare(set, set, new Set(['ch-panel', 'is-selected', 'ch-extra']))).toEqual(
            [],
        );
    });

    it('в эталоне есть, в коде нет → ошибка', () => {
        const errors = compare(
            new Set(['ch-panel', 'ch-hint']),
            new Set(['ch-panel']),
            new Set(['ch-panel', 'ch-hint']),
        );

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/есть в эталоне, нет в коде/);
        expect(errors[0]).toMatch(/ch-hint/);
    });

    it('в коде есть, в ДС нет → ошибка про самодельные классы', () => {
        const errors = compare(
            new Set(['ch-panel', 'ch-my-panel']),
            new Set(['ch-panel', 'ch-my-panel']),
            new Set(['ch-panel']),
        );

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/самодельные классы/);
        expect(errors[0]).toMatch(/ch-my-panel/);
    });
});
