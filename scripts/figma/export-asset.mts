/**
 * Экспорт растрового ассета из Figma в нужном масштабе (шаг 4 рецепта переноса).
 *
 * Закрывает боль №1 пилота STUDIO-038: флаг `--scale` у `figma-use export node`
 * молча игнорируется — и `--scale 2`, и `--scale=2` дают 1x. Ошибки нет, файл
 * создаётся, ассет просто не retina; ловится только замером результата. Обход —
 * `exportAsync` через Plugin API, здесь он оформлен командой.
 *
 * Использование:
 *   npm run figma:export -- 401:121 public/img/dress-code/pearl-cream.png
 *   npm run figma:export -- 218:17 out.png --scale 3
 *   npm run figma:export -- 218:17 out.svg --format SVG
 *
 * Повёрнутый узел приезжает уже повёрнутым (боль №4): CSS-поворот к такому
 * ассету применять не надо, а размеры брать из `renderBounds` инвентаря.
 *
 * Решение по каналу — D8 в gd-brain (docs/strategy/decisions/2026-07-25-figma-channel.md).
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { evalInFigma, FigmaUseError } from './figma-use.mts';

export type Format = 'PNG' | 'JPG' | 'SVG' | 'PDF';

const FORMATS: Format[] = ['PNG', 'JPG', 'SVG', 'PDF'];

/**
 * Скрипт экспорта в песочнице. Байты возвращаются base64-строкой через stdout —
 * бинарного канала у `eval` нет. Для SVG/PDF масштаб не применяется (вектор),
 * поэтому constraint ставится только для растра.
 */
export function buildScript(
    nodeId: string,
    format: Format,
    scale: number,
): string {
    const settings =
        format === 'PNG' || format === 'JPG'
            ? `{ format: ${JSON.stringify(format)}, constraint: { type: "SCALE", value: ${scale} } }`
            : `{ format: ${JSON.stringify(format)} }`;

    return `return (async () => {
  const n = await figma.getNodeByIdAsync(${JSON.stringify(nodeId)});
  if (!n) return JSON.stringify({ error: "узел не найден: ${nodeId}" });
  if (typeof n.exportAsync !== "function") return JSON.stringify({ error: "узел не экспортируется: " + n.type });

  const bytes = await n.exportAsync(${settings});
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);

  return JSON.stringify({
    name: n.name,
    type: n.type,
    rotation: "rotation" in n ? n.rotation : 0,
    bbox: n.absoluteBoundingBox,
    renderBounds: n.absoluteRenderBounds,
    base64: btoa(s),
  });
})()`;
}

/** Размер PNG из заголовка IHDR — чтобы проверить масштаб числом, а не на глаз. */
export function pngSize(buffer: Buffer): string | undefined {
    const isPng = buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47;

    return isPng
        ? `${buffer.readUInt32BE(16)}×${buffer.readUInt32BE(20)} px`
        : undefined;
}

export function parseArgs(argv: string[]): {
    nodeId: string;
    out: string;
    scale: number;
    format: Format;
} {
    const positional: string[] = [];
    let scale = 2;
    let format: Format | undefined;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--scale') {
            scale = Number(argv[(i += 1)]);
            continue;
        }

        if (arg === '--format') {
            format = argv[(i += 1)]?.toUpperCase() as Format;
            continue;
        }

        positional.push(arg);
    }

    if (positional.length !== 2 || !(scale > 0)) {
        throw new Error(
            'использование: npm run figma:export -- <nodeId> <файл> [--scale 2] [--format PNG|JPG|SVG|PDF]',
        );
    }

    const [nodeId, out] = positional;
    // Формат по умолчанию — из расширения файла: так команда короче в 9 случаях из 10.
    const guessed = out.split('.').pop()?.toUpperCase();
    const resolved =
        format ??
        (FORMATS.includes(guessed as Format) ? (guessed as Format) : 'PNG');

    if (!FORMATS.includes(resolved)) {
        throw new Error(
            `неизвестный формат: ${resolved} (есть ${FORMATS.join(', ')})`,
        );
    }

    return { nodeId, out, scale, format: resolved };
}

function main(argv: string[]): void {
    const { nodeId, out, scale, format } = parseArgs(argv);

    try {
        const raw = evalInFigma(buildScript(nodeId, format, scale));
        const result = JSON.parse(raw) as {
            error?: string;
            name: string;
            rotation: number;
            base64: string;
        };

        if (result.error) {
            throw new FigmaUseError(result.error);
        }

        const buffer = Buffer.from(result.base64, 'base64');

        writeFileSync(out, buffer);

        const size = pngSize(buffer);
        const rotated = Math.abs(result.rotation) > 0.001;

        console.log(
            `${out} — «${result.name}», ${format}${format === 'PNG' || format === 'JPG' ? ` @${scale}x` : ''}, ` +
                `${(buffer.length / 1024).toFixed(1)} КБ${size ? `, ${size}` : ''}`,
        );

        if (rotated) {
            console.log(
                `  ⚠ узел повёрнут на ${result.rotation.toFixed(2)}° — ассет уже повёрнут, ` +
                    'CSS-поворот не применять, размеры брать из renderBounds',
            );
        }
    } catch (error) {
        if (error instanceof FigmaUseError) {
            console.error(`✗ ${error.message}`);
            process.exit(1);
        }

        throw error;
    }
}

// Запуск только когда файл вызван командой: при импорте из тестов main молчит.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main(process.argv.slice(2));
}
