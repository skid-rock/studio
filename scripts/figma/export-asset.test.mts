/**
 * Разбор аргументов, чтение размера PNG и сборка скрипта экспорта.
 *
 * Ключевое здесь — масштаб: у самого `figma-use` флаг `--scale` игнорируется
 * молча, поэтому и constraint в скрипте, и замер размера по заголовку PNG
 * прикрыты тестами: если сломаются они, ассеты снова поедут в 1x незаметно.
 */
import { describe, expect, it } from 'vitest';

import { buildScript, parseArgs, pngSize } from './export-asset.mts';

/** Синтетический заголовок PNG: сигнатура + IHDR с шириной и высотой. */
function pngHeader(width: number, height: number): Buffer {
    const buffer = Buffer.alloc(33);

    buffer.write('\x89PNG\r\n\x1a\n', 0, 'binary');
    buffer.write('IHDR', 12, 'ascii');
    buffer.writeUInt32BE(width, 16);
    buffer.writeUInt32BE(height, 20);

    return buffer;
}

describe('parseArgs', () => {
    it('по умолчанию экспортирует в 2x, формат берёт из расширения файла', () => {
        expect(parseArgs(['238:2', 'public/img/rings.png'])).toEqual({
            nodeId: '238:2',
            out: 'public/img/rings.png',
            scale: 2,
            format: 'PNG',
        });
    });

    it('узнаёт формат по расширению без учёта регистра', () => {
        expect(parseArgs(['238:2', 'icon.svg']).format).toBe('SVG');
        expect(parseArgs(['238:2', 'photo.JPG']).format).toBe('JPG');
    });

    it('явный --format перекрывает расширение и нормализует регистр', () => {
        expect(parseArgs(['238:2', 'out.bin', '--format', 'svg']).format).toBe(
            'SVG',
        );
    });

    it('на незнакомое расширение падает обратно в PNG, а не в ошибку', () => {
        expect(parseArgs(['238:2', 'out.bin']).format).toBe('PNG');
    });

    it('читает --scale', () => {
        expect(parseArgs(['238:2', 'out.png', '--scale', '3']).scale).toBe(3);
    });

    it('требует id и файл', () => {
        expect(() => parseArgs(['238:2'])).toThrow(/использование/);
    });

    it('не принимает бессмысленный масштаб', () => {
        expect(() => parseArgs(['238:2', 'out.png', '--scale', '0'])).toThrow(
            /использование/,
        );
        expect(() => parseArgs(['238:2', 'out.png', '--scale', 'два'])).toThrow(
            /использование/,
        );
    });

    it('сообщает про неизвестный формат отдельно от подсказки по вызову', () => {
        expect(() =>
            parseArgs(['238:2', 'out.png', '--format', 'webp']),
        ).toThrow(/неизвестный формат/);
    });
});

describe('pngSize', () => {
    it('читает ширину и высоту из IHDR', () => {
        expect(pngSize(pngHeader(240, 226))).toBe('240×226 px');
    });

    it('молчит на не-PNG: у SVG и PDF размеров в заголовке нет', () => {
        expect(
            pngSize(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" />')),
        ).toBeUndefined();
    });

    it('молчит на обрезанном буфере вместо чтения мусора за границей', () => {
        expect(pngSize(pngHeader(240, 226).subarray(0, 20))).toBeUndefined();
    });
});

describe('buildScript', () => {
    it('ставит растру constraint SCALE — то, чего не делает сломанный --scale', () => {
        expect(buildScript('238:2', 'PNG', 2)).toContain(
            'constraint: { type: "SCALE", value: 2 }',
        );
    });

    it('вектору масштаб не навязывает', () => {
        const script = buildScript('238:2', 'SVG', 2);

        expect(script).toContain('{ format: "SVG" }');
        expect(script).not.toContain('SCALE');
    });

    it('возвращает поворот и renderBounds — предупреждение о «запечённом» повороте', () => {
        const script = buildScript('238:2', 'PNG', 2);

        expect(script).toContain('rotation');
        expect(script).toContain('absoluteRenderBounds');
    });

    it('отдаёт байты base64: бинарного канала у eval нет', () => {
        expect(buildScript('238:2', 'PNG', 2)).toContain('btoa(s)');
    });

    it('подставляет id строковым литералом', () => {
        expect(buildScript('238:2', 'PNG', 2)).toContain(
            'figma.getNodeByIdAsync("238:2")',
        );
    });
});
