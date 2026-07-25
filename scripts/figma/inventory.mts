/**
 * Инвентарь фрейма Figma одним вызовом (шаг 3 рецепта переноса секции).
 *
 * Закрывает боль №3 пилота STUDIO-038: `figma-use node tree` не отдаёт
 * sizing-режимы, выравнивание, constraints, эффекты, скругления и поворот, и за
 * каждой деталью приходилось идти отдельным `eval` — 3–4 лишних захода на секцию.
 * Здесь всё поддерево снимается за один заход обходом в песочнице плагина.
 *
 * Использование:
 *   npm run figma:inventory -- 32:127
 *   npm run figma:inventory -- 32:127 --depth 2 --out /tmp/dress-code.json
 *
 * Решение по каналу — D8 в gd-brain (docs/strategy/decisions/2026-07-25-figma-channel.md).
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { evalInFigma, FigmaUseError } from './figma-use.mts';

/** Скалярные свойства узла, которые снимаем, если они есть у этого типа. */
const SCALAR_FIELDS = [
    'visible',
    'opacity',
    'rotation',
    'cornerRadius',
    'layoutMode',
    'layoutWrap',
    'layoutSizingHorizontal',
    'layoutSizingVertical',
    'layoutPositioning',
    'layoutAlign',
    'layoutGrow',
    'primaryAxisSizingMode',
    'counterAxisSizingMode',
    'primaryAxisAlignItems',
    'counterAxisAlignItems',
    'itemSpacing',
    'counterAxisSpacing',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'clipsContent',
    'constraints',
    'blendMode',
    'strokeWeight',
    'strokeAlign',
    'dashPattern',
    // Текст: то, ради чего на шаге 3 рецепта выписывают типографику.
    'characters',
    'fontName',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textAlignHorizontal',
    'textAlignVertical',
    'textAutoResize',
    'textCase',
    'textDecoration',
] as const;

/**
 * Скрипт обхода, исполняемый внутри плагина.
 *
 * Цвета нормализуются в hex прямо в песочнице: Plugin API отдаёт компоненты
 * float 0..1, а на шаге 5 рецепта нужен именно hex для маппинга на DTCG-токены.
 * `figma.mixed` (смешанные значения у текста и скруглений) отдаём строкой
 * "MIXED" — так видно, что свойство неоднородно, и оно не исчезает молча.
 */
export function buildScript(rootId: string, depth: number): string {
    return `return (async () => {
  const MAX_DEPTH = ${depth};
  const FIELDS = ${JSON.stringify(SCALAR_FIELDS)};

  const hex = (c) => {
    const to = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
    return ("#" + to(c.r) + to(c.g) + to(c.b)).toUpperCase();
  };

  const paint = (p) => {
    const o = { type: p.type };
    if (p.visible === false) o.visible = false;
    if (typeof p.opacity === "number" && p.opacity !== 1) o.opacity = p.opacity;
    if (p.color) o.hex = hex(p.color);
    if (p.gradientStops) o.stops = p.gradientStops.map((s) => ({ position: s.position, hex: hex(s.color), a: s.color.a }));
    if (p.type === "IMAGE") { o.scaleMode = p.scaleMode; o.imageHash = p.imageHash; }
    if (p.boundVariables && p.boundVariables.color) o.boundVariable = p.boundVariables.color.id;
    return o;
  };

  const value = (v) => (v === figma.mixed ? "MIXED" : v);

  const pick = (n, level) => {
    const o = { id: n.id, name: n.name, type: n.type };

    for (const k of FIELDS) {
      if (!(k in n)) continue;
      const v = n[k];
      if (v === undefined || v === null) continue;
      o[k] = value(v);
    }

    if ("fills" in n && n.fills !== figma.mixed && n.fills.length) o.fills = n.fills.map(paint);
    if ("strokes" in n && n.strokes && n.strokes.length) o.strokes = n.strokes.map(paint);
    if ("effects" in n && n.effects && n.effects.length) o.effects = n.effects;

    // Привязки к переменным — вход для наведения variables (STUDIO-040).
    if (n.boundVariables && Object.keys(n.boundVariables).length) o.boundVariables = n.boundVariables;

    // absoluteRenderBounds — единственный способ поймать «запечённый» поворот
    // (боль №4 рецепта): у повёрнутого узла bbox в дереве до поворота, а
    // экспорт приезжает уже повёрнутым.
    if (n.absoluteBoundingBox) o.bbox = n.absoluteBoundingBox;
    if (n.absoluteRenderBounds) o.renderBounds = n.absoluteRenderBounds;

    if ("children" in n) {
      if (MAX_DEPTH >= 0 && level >= MAX_DEPTH) o.childCount = n.children.length;
      else o.children = n.children.map((c) => pick(c, level + 1));
    }

    return o;
  };

  const root = await figma.getNodeByIdAsync(${JSON.stringify(rootId)});
  if (!root) return JSON.stringify({ error: "узел не найден: ${rootId}" });

  return JSON.stringify(pick(root, 0));
})()`;
}

export function parseArgs(argv: string[]): {
    nodeId: string;
    depth: number;
    out?: string;
} {
    const positional: string[] = [];
    let depth = -1;
    let out: string | undefined;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--depth') {
            depth = Number(argv[(i += 1)]);
            continue;
        }

        if (arg === '--out') {
            out = argv[(i += 1)];
            continue;
        }

        positional.push(arg);
    }

    if (positional.length !== 1 || Number.isNaN(depth)) {
        throw new Error(
            'использование: npm run figma:inventory -- <nodeId> [--depth N] [--out файл.json]',
        );
    }

    return { nodeId: positional[0], depth, out };
}

function main(argv: string[]): void {
    const { nodeId, depth, out } = parseArgs(argv);

    try {
        const raw = evalInFigma(buildScript(nodeId, depth));
        const pretty = JSON.stringify(JSON.parse(raw), null, 2);

        if (out) {
            writeFileSync(out, pretty + '\n', 'utf8');
            console.log(`${out} — ${pretty.length} символов`);
        } else {
            console.log(pretty);
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
