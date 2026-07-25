/**
 * Разбор аргументов и сборка скрипта обхода для инвентаря фрейма.
 *
 * Живая Figma здесь не нужна: проверяется то, что ломается молча — подстановка
 * id и глубины в текст скрипта и разбор командной строки.
 */
import { describe, expect, it } from 'vitest';

import { buildScript, parseArgs } from './inventory.mts';

describe('parseArgs', () => {
    it('по умолчанию обходит дерево целиком (depth -1) и печатает в stdout', () => {
        expect(parseArgs(['32:127'])).toEqual({
            nodeId: '32:127',
            depth: -1,
            out: undefined,
        });
    });

    it('читает --depth и --out в любом порядке относительно id', () => {
        expect(
            parseArgs(['--depth', '2', '32:127', '--out', '/tmp/s.json']),
        ).toEqual({ nodeId: '32:127', depth: 2, out: '/tmp/s.json' });
    });

    it('требует ровно один id', () => {
        expect(() => parseArgs([])).toThrow(/использование/);
        expect(() => parseArgs(['32:127', '287:178'])).toThrow(/использование/);
    });

    it('не пропускает нечисловую глубину', () => {
        expect(() => parseArgs(['32:127', '--depth', 'глубоко'])).toThrow(
            /использование/,
        );
    });
});

describe('buildScript', () => {
    it('подставляет id строковым литералом — двоеточие в 32:127 не должно ломать скрипт', () => {
        expect(buildScript('32:127', -1)).toContain(
            'figma.getNodeByIdAsync("32:127")',
        );
    });

    it('экранирует кавычки в id, а не склеивает их с кодом', () => {
        expect(buildScript('a"b', -1)).toContain(String.raw`"a\"b"`);
    });

    it('передаёт глубину обхода константой', () => {
        expect(buildScript('32:127', 2)).toContain('const MAX_DEPTH = 2;');
    });

    it('снимает поля, которых нет в node tree, — ради них скрипт и написан', () => {
        const script = buildScript('32:127', -1);

        for (const field of [
            'layoutSizingHorizontal',
            'counterAxisAlignItems',
            'constraints',
            'rotation',
            'cornerRadius',
        ]) {
            expect(script).toContain(field);
        }

        // renderBounds — единственный способ поймать «запечённый» поворот (боль №4).
        expect(script).toContain('absoluteRenderBounds');
        // Цвета нормализуются в hex прямо в песочнице: на шаге 5 рецепта нужен hex.
        expect(script).toContain('const hex =');
    });

    it('возвращает результат явным return — иначе eval молча отдаст пустоту', () => {
        expect(
            buildScript('32:127', -1).startsWith('return (async () =>'),
        ).toBe(true);
    });
});
