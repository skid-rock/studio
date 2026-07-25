/**
 * Разбор ответа канала `figma-use eval`.
 *
 * Смысл покрытия: CLI сообщает об ошибках Plugin API не кодом выхода, а текстом
 * в stdout — если перестать их распознавать, исключение в песочнице приедет в
 * вызывающий код как «валидный результат» и всплывёт много позже.
 */
import { describe, expect, it } from 'vitest';

import { FigmaUseError, interpretEvalOutput } from './figma-use.mts';

describe('interpretEvalOutput', () => {
    it('отдаёт результат, обрезая пробелы и переводы строк', () => {
        expect(interpretEvalOutput('  {"id":"32:127"}\n')).toBe(
            '{"id":"32:127"}',
        );
    });

    it('распознаёт ошибку Plugin API по маркеру ✗ (код выхода при этом нулевой)', () => {
        expect(() =>
            interpretEvalOutput('✗ ReferenceError: field is not defined'),
        ).toThrow(FigmaUseError);

        expect(() =>
            interpretEvalOutput('✗ ReferenceError: field is not defined'),
        ).toThrow(/ReferenceError/);
    });

    it('на пустой ответ подсказывает про забытый return (боль №2 рецепта)', () => {
        expect(() => interpretEvalOutput('   \n')).toThrow(/return/);
    });

    it('не считает ошибкой результат, где ✗ стоит не в начале', () => {
        expect(interpretEvalOutput('{"name":"✗ галочка"}')).toBe(
            '{"name":"✗ галочка"}',
        );
    });
});
