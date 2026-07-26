/**
 * Правила чекера секции: структура, нейминг и разбор снимков стресс-теста.
 *
 * Живая Figma здесь не нужна — ради этого правила и вынесены из песочницы в
 * чистые функции: снимок дерева и снимок «до/после» подставляются руками.
 * Главное, что проверяется, — граница между настоящей поломкой и законным
 * поведением при сужении (перенос строк, свисающий декор).
 */
import { describe, expect, it } from 'vitest';

import {
    buildStressScript,
    buildTreeScript,
    checkNaming,
    checkStress,
    checkStructure,
    formatReport,
    parseArgs,
    verdict,
    type Box,
    type Finding,
    type StressSnapshot,
    type TreeNode,
} from './check-section.mts';

/** Узел дерева с разумными умолчаниями: в тесте задаём только то, что проверяем. */
function node(patch: Partial<TreeNode> & { id: string }): TreeNode {
    return {
        name: 'Узел',
        type: 'FRAME',
        visible: true,
        width: 393,
        height: 100,
        childCount: patch.children?.length ?? 0,
        ...patch,
    };
}

function box(patch: Partial<Box> & { id: string }): Box {
    return {
        name: 'Узел',
        type: 'FRAME',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        ...patch,
    };
}

/** Правила, сработавшие на наборе, — сравнивать удобнее по именам. */
function rules(findings: Finding[]): string[] {
    return findings.map((f) => f.rule);
}

describe('parseArgs', () => {
    it('по умолчанию гонит стресс-тест на 393 → 320 и печатает текстом', () => {
        expect(parseArgs(['--root', '32:127'])).toEqual({
            rootId: '32:127',
            width: 393,
            narrow: 320,
            stress: true,
            json: false,
        });
    });

    it('читает --width, --narrow, --no-stress и --json', () => {
        expect(
            parseArgs([
                '--root',
                '32:127',
                '--width',
                '360',
                '--narrow',
                '260',
                '--no-stress',
                '--json',
            ]),
        ).toEqual({
            rootId: '32:127',
            width: 360,
            narrow: 260,
            stress: false,
            json: true,
        });
    });

    it('требует --root', () => {
        expect(() => parseArgs([])).toThrow(/использование/);
        expect(() => parseArgs(['--json'])).toThrow(/использование/);
    });

    it('не пропускает нечисловую ширину', () => {
        expect(() =>
            parseArgs(['--root', '32:127', '--narrow', 'узко']),
        ).toThrow(/использование/);
    });

    it('падает на неизвестном аргументе, а не проглатывает его молча', () => {
        expect(() => parseArgs(['--root', '32:127', '--fix'])).toThrow(
            /неизвестный аргумент/,
        );
    });
});

describe('buildTreeScript / buildStressScript', () => {
    it('подставляют id строковым литералом — двоеточие в 32:127 не должно ломать скрипт', () => {
        expect(buildTreeScript('32:127')).toContain(
            'figma.getNodeByIdAsync("32:127")',
        );
        expect(buildStressScript('32:127', 320)).toContain(
            'figma.getNodeByIdAsync("32:127")',
        );
    });

    it('возвращают результат явным return — иначе eval молча отдаст пустоту', () => {
        expect(buildTreeScript('32:127').startsWith('return (async () =>')).toBe(
            true,
        );
        expect(
            buildStressScript('32:127', 320).startsWith('return (async () =>'),
        ).toBe(true);
    });

    it('удаляют клон в finally — клон не должен пережить исключение при resize', () => {
        const script = buildStressScript('32:127', 320);

        expect(script).toContain('finally');
        expect(script).toContain('clone.remove()');
        // Уборка обязана быть в том же вызове, что и создание клона.
        expect(script.indexOf('src.clone()')).toBeLessThan(
            script.indexOf('clone.remove()'),
        );
    });

    it('передаёт ширину сужения в resize', () => {
        expect(buildStressScript('32:127', 260)).toContain(
            'clone.resize(260, clone.height)',
        );
    });
});

describe('checkStructure', () => {
    it('ловит контейнер на координатах — то, на чём молчит штатный prefer-auto-layout', () => {
        const root = node({
            id: '1',
            layoutMode: 'VERTICAL',
            children: [
                node({ id: '2', children: [node({ id: '3', type: 'TEXT' })] }),
            ],
        });

        expect(rules(checkStructure(root, 393))).toContain(
            'container-auto-layout',
        );
    });

    it('проверяет и INSTANCE — секция из инстансов не должна проскакивать не глядя', () => {
        const root = node({
            id: '1',
            layoutMode: 'VERTICAL',
            children: [
                node({
                    id: '2',
                    type: 'INSTANCE',
                    children: [node({ id: '3', type: 'TEXT' })],
                }),
            ],
        });

        expect(rules(checkStructure(root, 393))).toContain(
            'container-auto-layout',
        );
    });

    it('ABSOLUTE у содержания — ошибка, у deco/* — норма', () => {
        const build = (name: string): TreeNode =>
            node({
                id: '1',
                layoutMode: 'VERTICAL',
                children: [
                    node({
                        id: '2',
                        name,
                        type: 'RECTANGLE',
                        layoutPositioning: 'ABSOLUTE',
                    }),
                ],
            });

        expect(rules(checkStructure(build('кольца'), 393))).toContain(
            'absolute-only-deco',
        );
        expect(rules(checkStructure(build('deco/кольца'), 393))).not.toContain(
            'absolute-only-deco',
        );
    });

    it('кейс, который штатный линтер пропускает: auto layout есть, но все дети ABSOLUTE', () => {
        const root = node({
            id: '1',
            layoutMode: 'VERTICAL',
            children: [
                node({ id: '2', type: 'TEXT', layoutPositioning: 'ABSOLUTE' }),
                node({ id: '3', type: 'TEXT', layoutPositioning: 'ABSOLUTE' }),
            ],
        });
        const findings = checkStructure(root, 393);

        expect(rules(findings).filter((r) => r === 'absolute-only-deco')).toHaveLength(
            2,
        );
        expect(verdict(findings)).toBe('fail');
    });

    it('сплошной FIXED у вложенного контейнера — warning, вердикт не роняет', () => {
        const root = node({
            id: '1',
            layoutMode: 'VERTICAL',
            children: [
                node({
                    id: '2',
                    layoutMode: 'HORIZONTAL',
                    layoutSizingHorizontal: 'FIXED',
                    layoutSizingVertical: 'FIXED',
                    children: [node({ id: '3', type: 'TEXT' })],
                }),
            ],
        });
        const findings = checkStructure(root, 393);

        expect(rules(findings)).toContain('rigid-sizing');
        expect(verdict(findings)).toBe('pass');
    });

    it('ширина секции сверяется с эталонной макета', () => {
        const root = node({ id: '1', width: 400, layoutMode: 'VERTICAL' });

        expect(rules(checkStructure(root, 393))).toContain('section-width');
        // Отклонение в пределах допуска — шум раскладки, не нарушение.
        expect(
            rules(checkStructure(node({ id: '1', width: 394.5 }), 393)),
        ).not.toContain('section-width');
    });

    it('не ходит в скрытые ветки — это забота линта (no-hidden-layers)', () => {
        const root = node({
            id: '1',
            layoutMode: 'VERTICAL',
            children: [
                node({
                    id: '2',
                    visible: false,
                    children: [node({ id: '3', type: 'TEXT' })],
                }),
            ],
        });

        expect(rules(checkStructure(root, 393))).not.toContain(
            'container-auto-layout',
        );
    });

    it('путь узла в отчёте — от корня, чтобы находить его глазами в макете', () => {
        const root = node({
            id: '1',
            name: '4 Dress Code',
            layoutMode: 'VERTICAL',
            children: [
                node({
                    id: '2',
                    name: 'Фотокарточка',
                    children: [node({ id: '3', name: 'фото', type: 'RECTANGLE' })],
                }),
            ],
        });
        const finding = checkStructure(root, 393).find(
            (f) => f.rule === 'container-auto-layout',
        );

        expect(finding?.path).toBe('4 Dress Code / Фотокарточка');
        expect(finding?.nodeId).toBe('2');
    });
});

describe('checkNaming', () => {
    it('имя по конвенции и по реестру секций studio — чисто', () => {
        expect(checkNaming(node({ id: '1', name: 'Section/Hero' }))).toEqual([]);
        expect(
            checkNaming(node({ id: '1', name: 'Section/Dress Code Pearls' })),
        ).toEqual([]);
    });

    it('имя не по конвенции — warning, а не error: так назван почти весь макет', () => {
        const findings = checkNaming(node({ id: '1', name: '1 Intro' }));

        expect(rules(findings)).toEqual(['section-naming']);
        expect(verdict(findings)).toBe('pass');
    });

    it('форма верна, но типа нет в реестре — тоже warning', () => {
        expect(
            rules(checkNaming(node({ id: '1', name: 'Section/Unknown' }))),
        ).toEqual(['section-naming']);
    });
});

describe('checkStress', () => {
    /** Секция 393 → 320: корень до и после, дети подставляются тестом. */
    const snapshot = (before: Box[], after: Box[]): StressSnapshot => ({
        rootBefore: box({ id: 'root', x: 0, width: 393, height: 900 }),
        rootAfter: box({ id: 'root', x: 0, width: 320, height: 950 }),
        before,
        after,
    });

    it('содержание, вылезшее за границу секции, — ошибка', () => {
        const findings = checkStress(
            snapshot(
                [box({ id: 'a', name: 'фото', x: 0, width: 300 })],
                [box({ id: 'a', name: 'фото', x: 0, width: 333 })],
            ),
        );

        expect(rules(findings)).toEqual(['stress-overflow']);
        expect(findings[0].severity).toBe('error');
        expect(findings[0].message).toContain('13px');
    });

    it('вылет deco/* — warning: свисающий декор в вёрстке штатный приём', () => {
        const findings = checkStress(
            snapshot(
                [box({ id: 'a', name: 'deco/кольца', x: 0, width: 300 })],
                [box({ id: 'a', name: 'deco/кольца', x: 0, width: 333 })],
            ),
        );

        expect(findings[0].severity).toBe('warning');
        expect(verdict(findings)).toBe('pass');
    });

    it('узел, торчавший за край и до сужения, не считается вылетевшим', () => {
        const findings = checkStress(
            snapshot(
                [box({ id: 'a', x: 380, width: 60 })],
                [box({ id: 'a', x: 380, width: 60 })],
            ),
        );

        expect(findings).toEqual([]);
    });

    it('рост высоты TEXT при переносе строк дефектом не считается', () => {
        const findings = checkStress(
            snapshot(
                [
                    box({ id: 't1', type: 'TEXT', x: 32, y: 0, width: 329, height: 40 }),
                    box({ id: 't2', type: 'TEXT', x: 32, y: 56, width: 329, height: 46 }),
                ],
                [
                    // Первый текст перетёк на лишнюю строку, второй уехал вниз —
                    // законное поведение auto layout, а не поломка.
                    box({ id: 't1', type: 'TEXT', x: 16, y: 0, width: 288, height: 72 }),
                    box({ id: 't2', type: 'TEXT', x: 16, y: 88, width: 288, height: 69 }),
                ],
            ),
        );

        expect(findings).toEqual([]);
    });

    it('новое наложение текстов — ошибка', () => {
        const findings = checkStress(
            snapshot(
                [
                    box({ id: 't1', type: 'TEXT', x: 32, y: 0, width: 200, height: 40 }),
                    box({ id: 't2', type: 'TEXT', x: 32, y: 60, width: 200, height: 40 }),
                ],
                [
                    box({ id: 't1', type: 'TEXT', x: 16, y: 0, width: 200, height: 80 }),
                    // Сосед остался на месте — тексты наехали друг на друга.
                    box({ id: 't2', type: 'TEXT', x: 16, y: 60, width: 200, height: 40 }),
                ],
            ),
        );

        expect(rules(findings)).toEqual(['stress-collision']);
        expect(findings[0].severity).toBe('error');
    });

    it('наложение, существовавшее до сужения, — замысел макета, не поломка', () => {
        const overlapping = [
            box({ id: 't1', type: 'TEXT', x: 32, y: 0, width: 200, height: 80 }),
            box({ id: 't2', type: 'TEXT', x: 32, y: 40, width: 200, height: 40 }),
        ];

        expect(checkStress(snapshot(overlapping, overlapping))).toEqual([]);
    });

    it('наложения ищутся только между текстами — декор поверх фото это норма', () => {
        const findings = checkStress(
            snapshot(
                [
                    box({ id: 'p', type: 'RECTANGLE', x: 0, y: 0, width: 200, height: 200 }),
                    box({ id: 'd', type: 'RECTANGLE', x: 250, y: 0, width: 60, height: 60 }),
                ],
                [
                    box({ id: 'p', type: 'RECTANGLE', x: 0, y: 0, width: 200, height: 200 }),
                    box({ id: 'd', type: 'RECTANGLE', x: 100, y: 100, width: 60, height: 60 }),
                ],
            ),
        );

        expect(findings).toEqual([]);
    });
});

describe('verdict / formatReport', () => {
    const warning: Finding = {
        rule: 'section-naming',
        severity: 'warning',
        nodeId: '1',
        path: '1 Intro',
        message: 'имя корня не в форме «Section/<Name>»',
    };
    const error: Finding = {
        rule: 'container-auto-layout',
        severity: 'error',
        nodeId: '2',
        path: '3 Schedule',
        message: 'контейнер собран на координатах',
    };

    it('вердикт роняют только error', () => {
        expect(verdict([])).toBe('pass');
        expect(verdict([warning])).toBe('pass');
        expect(verdict([warning, error])).toBe('fail');
    });

    it('текстовый отчёт считает error и warning раздельно', () => {
        const report = formatReport([warning, error], false);

        expect(report).toContain('✖ fail — 1 error, 1 warning');
        expect(report).toContain('3 Schedule (2)');
    });

    it('чистый прогон говорит это прямым текстом', () => {
        expect(formatReport([], false)).toContain('pass');
    });

    it('--json отдаёт находки и вердикт машинно', () => {
        expect(JSON.parse(formatReport([warning], true))).toEqual({
            findings: [warning],
            verdict: 'pass',
        });
    });
});
