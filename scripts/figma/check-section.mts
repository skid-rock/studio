/**
 * Чекер секции Figma: структура и устойчивость композиции к сужению.
 *
 * Закрывает то, что линтер figma-use не проверяет (STUDIO-040): штатное
 * prefer-auto-layout замолкает на фрейме, если хоть одна пара детей
 * пересекается bbox'ами, и в любом случае смотрит на флаг layoutMode, а не на
 * поведение — контейнер со всеми детьми в ABSOLUTE проверку проходит и
 * рассыпается при первом ресайзе.
 *
 * Использование:
 *   npm run figma:check -- --root 32:127
 *   npm run figma:check -- --root 32:127 --width 393 --narrow 320 --json
 *   npm run figma:check -- --root 32:127 --no-stress
 */
import { pathToFileURL } from 'node:url';

import { evalJson, FigmaUseError } from './figma-use.mts';

/** Ширина эталонного мобильного макета и ширина, до которой сужаем в стресс-тесте. */
const DEFAULT_WIDTH = 393;
const DEFAULT_NARROW = 320;

/** Допуск в пикселях: ниже него расхождения считаем шумом раскладки. */
const TOLERANCE = 2;

/** Префикс имени, которому разрешено absolute-позиционирование. */
const DECO_PREFIX = 'deco/';

/**
 * Типы секций реестра studio (src/sections/registry.default.ts) — списком, а не
 * импортом: скрипт-обвязка не тянет в себя ядро (правило границ проекта).
 * Обновлять вручную при добавлении секции.
 */
const SECTION_TYPES = [
    'intro/envelope',
    'hero',
    'our-story',
    'schedule',
    'countdown',
    'venue',
    'dress-code',
    'dress-code-pearls',
    'details-faq',
    'contacts',
    'rsvp',
    'closing',
    'deco-collage',
] as const;

/** Попап RSVP — не секция лендинга; имя RSVP/Popup принято (STUDIO-056/061). */
const NON_SECTION_ROOTS = new Set(['RSVP/Popup']);

export interface Options {
    rootId: string;
    width: number;
    narrow: number;
    stress: boolean;
    json: boolean;
}

export function parseArgs(argv: string[]): Options {
    let rootId: string | undefined;
    let width = DEFAULT_WIDTH;
    let narrow = DEFAULT_NARROW;
    let stress = true;
    let json = false;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--root') {
            rootId = argv[(i += 1)];
            continue;
        }
        if (arg === '--width') {
            width = Number(argv[(i += 1)]);
            continue;
        }
        if (arg === '--narrow') {
            narrow = Number(argv[(i += 1)]);
            continue;
        }
        if (arg === '--no-stress') {
            stress = false;
            continue;
        }
        if (arg === '--json') {
            json = true;
            continue;
        }

        throw new Error(`неизвестный аргумент: ${arg}`);
    }

    if (!rootId || Number.isNaN(width) || Number.isNaN(narrow)) {
        throw new Error(
            'использование: npm run figma:check -- --root <nodeId> ' +
                '[--width 393] [--narrow 320] [--no-stress] [--json]',
        );
    }

    return { rootId, width, narrow, stress, json };
}

/** Узел секции в том виде, в каком его снимает песочница. */
export interface TreeNode {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    width: number;
    height: number;
    childCount: number;
    layoutMode?: string;
    layoutPositioning?: string;
    layoutSizingHorizontal?: string;
    layoutSizingVertical?: string;
    children?: TreeNode[];
}

export function buildTreeScript(rootId: string): string {
    return `return (async () => {
  const pick = (n) => {
    const o = {
      id: n.id, name: n.name, type: n.type,
      visible: n.visible !== false,
      width: Math.round(n.width * 100) / 100,
      height: Math.round(n.height * 100) / 100,
      childCount: "children" in n ? n.children.length : 0
    };
    for (const k of ["layoutMode","layoutPositioning","layoutSizingHorizontal","layoutSizingVertical"]) {
      if (k in n && n[k] != null) o[k] = n[k];
    }
    if ("children" in n) o.children = n.children.map(pick);
    return o;
  };

  const root = await figma.getNodeByIdAsync(${JSON.stringify(rootId)});
  if (!root) return JSON.stringify({ error: "узел не найден: ${rootId}" });
  return JSON.stringify(pick(root));
})()`;
}

export type Severity = 'error' | 'warning';

export interface Finding {
    rule: string;
    severity: Severity;
    nodeId: string;
    path: string;
    message: string;
}

/**
 * Контейнер — фрейм/компонент/инстанс с детьми; только к таким применима
 * проверка auto layout. INSTANCE в списке намеренно: у инстанса компонента
 * layoutMode такой же, как у любого фрейма, и без него секция, собранная из
 * инстансов, прошла бы проверку не глядя.
 */
function isContainer(node: TreeNode): boolean {
    return (
        (node.type === 'FRAME' ||
            node.type === 'COMPONENT' ||
            node.type === 'INSTANCE') &&
        node.childCount > 0
    );
}

/**
 * Декор — слой с префиксом `deco/`. Ему разрешено лежать вне потока и свисать
 * за границу секции: в вёрстке такой слой позиционируется абсолютно, а секция
 * его клипает (`overflow: hidden`).
 *
 * Дополнительно ABSOLUTE разрешён внутри холста `stage` (коллаж с редактируемыми
 * фото/текстом — deco-collage): иначе контентные слои пришлось бы маскировать
 * под `deco/*`.
 */
function isDecoName(name: string): boolean {
    return name.startsWith(DECO_PREFIX);
}

function isDeco(node: TreeNode): boolean {
    return isDecoName(node.name);
}

function allowsAbsolute(node: TreeNode, path: string[]): boolean {
    return isDeco(node) || path.includes('stage');
}

/**
 * Статические проверки структуры секции.
 *
 * Сознательное отличие от штатного prefer-auto-layout: auto layout требуется у
 * КАЖДОГО контейнера безусловно — без порога «≥N детей» и без глушилки по
 * перекрытиям, из-за которой линтер молчал на самых декоративных секциях.
 */
export function checkStructure(root: TreeNode, width: number): Finding[] {
    const findings: Finding[] = [];

    const walk = (node: TreeNode, path: string[], isRoot: boolean): void => {
        const here = [...path, node.name];
        const at = here.join(' / ');

        if (!node.visible) return; // скрытые ветки не проверяем: это забота линта

        if (isContainer(node) && (!node.layoutMode || node.layoutMode === 'NONE')) {
            findings.push({
                rule: 'container-auto-layout',
                severity: 'error',
                nodeId: node.id,
                path: at,
                message: `контейнер с ${node.childCount} детьми собран на координатах (layoutMode NONE)`,
            });
        }

        if (
            !isRoot &&
            node.layoutPositioning === 'ABSOLUTE' &&
            !allowsAbsolute(node, path)
        ) {
            findings.push({
                rule: 'absolute-only-deco',
                severity: 'error',
                nodeId: node.id,
                path: at,
                message: `absolute-позиционирование разрешено слоям «${DECO_PREFIX}*» или потомкам «stage»`,
            });
        }

        // Сплошной FIXED у вложенного контейнера — блок не дышит. Warning:
        // бывает осознанным (картинка фиксированного размера).
        if (
            !isRoot &&
            isContainer(node) &&
            node.layoutSizingHorizontal === 'FIXED' &&
            node.layoutSizingVertical === 'FIXED'
        ) {
            findings.push({
                rule: 'rigid-sizing',
                severity: 'warning',
                nodeId: node.id,
                path: at,
                message: 'контейнер зафиксирован по обеим осям (ни FILL, ни HUG)',
            });
        }

        for (const child of node.children ?? []) walk(child, here, false);
    };

    walk(root, [], true);

    if (Math.abs(root.width - width) > TOLERANCE) {
        findings.push({
            rule: 'section-width',
            severity: 'error',
            nodeId: root.id,
            path: root.name,
            message: `ширина секции ${root.width} вместо ${width} — секции макета должны совпадать по ширине`,
        });
    }

    findings.push(...checkNaming(root));

    return findings;
}

/**
 * Нейминг корня: `Section/<Name>`, где `<Name>` мапится на тип реестра studio.
 * Severity warning — в текущем макете почти все секции названы иначе
 * («1 Intro», «3 Schedule»), и вердикт на этом ронять рано.
 */
export function checkNaming(root: TreeNode): Finding[] {
    if (NON_SECTION_ROOTS.has(root.name)) {
        return [];
    }

    const match = /^Section\/(.+)$/.exec(root.name);

    if (!match) {
        return [
            {
                rule: 'section-naming',
                severity: 'warning',
                nodeId: root.id,
                path: root.name,
                message: 'имя корня не в форме «Section/<Name>»',
            },
        ];
    }

    const slug = match[1].trim().toLowerCase().replace(/\s+/g, '-');

    if (!SECTION_TYPES.includes(slug as (typeof SECTION_TYPES)[number])) {
        return [
            {
                rule: 'section-naming',
                severity: 'warning',
                nodeId: root.id,
                path: root.name,
                message: `«${slug}» не совпадает ни с одним типом реестра секций studio`,
            },
        ];
    }

    return [];
}

export interface Box {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface StressSnapshot {
    error?: string;
    rootBefore: Box;
    rootAfter: Box;
    before: Box[];
    after: Box[];
}

/**
 * Скрипт стресс-теста в песочнице: клон секции → сужение → два замера bbox.
 *
 * Клон обязан исчезнуть в том же вызове — весь цикл живёт в одном `eval` с
 * `try/finally` внутри песочницы, поэтому даже исключение при `resize` не
 * оставит мусора в файле.
 */
export function buildStressScript(rootId: string, narrow: number): string {
    return `return (async () => {
  const src = await figma.getNodeByIdAsync(${JSON.stringify(rootId)});
  if (!src) return JSON.stringify({ error: "узел не найден: ${rootId}" });

  const box = (n) => {
    const b = n.absoluteBoundingBox;
    return b ? { id: n.id, name: n.name, type: n.type,
                 x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100,
                 width: Math.round(b.width * 100) / 100, height: Math.round(b.height * 100) / 100 } : null;
  };

  // Плоский список видимых потомков: сравнивать «до/после» удобнее по id.
  const flat = (n, acc) => {
    for (const c of ("children" in n ? n.children : [])) {
      if (c.visible === false) continue;
      const b = box(c);
      if (b) acc.push(b);
      flat(c, acc);
    }
    return acc;
  };

  let clone = null;
  try {
    clone = src.clone();
    clone.name = "__stress__ " + src.name;
    // Кладём рядом с оригиналом, чтобы не путать глазами, если что-то пойдёт не так.
    figma.currentPage.appendChild(clone);
    clone.x = src.x + src.width + 400;
    clone.y = src.y;

    const rootBefore = box(clone);
    const before = flat(clone, []);

    // HUG по горизонтали не даст сузить фрейм — переводим в FIXED.
    if ("layoutSizingHorizontal" in clone && clone.layoutSizingHorizontal === "HUG") {
      clone.layoutSizingHorizontal = "FIXED";
    }
    clone.resize(${narrow}, clone.height);

    const rootAfter = box(clone);
    const after = flat(clone, []);

    return JSON.stringify({ rootBefore, rootAfter, before, after });
  } finally {
    if (clone) clone.remove();
  }
})()`;
}

function overlaps(a: Box, b: Box): boolean {
    return (
        a.x < b.x + b.width - TOLERANCE &&
        a.x + a.width - TOLERANCE > b.x &&
        a.y < b.y + b.height - TOLERANCE &&
        a.y + a.height - TOLERANCE > b.y
    );
}

function byId(boxes: Box[]): Map<string, Box> {
    return new Map(boxes.map((b) => [b.id, b]));
}

/**
 * Контент коллажа внутри `stage` (фото, монограмма): при сужении абсолютные
 * слои вылезают так же штатно, как `deco/*` — секция клипает overflow.
 */
function isCollageContentName(name: string): boolean {
    return /^(photoLeft|photoRight|monogram|letterLeft|letterRight|amp)$/.test(
        name,
    );
}

function softOverflow(name: string): boolean {
    return isDecoName(name) || isCollageContentName(name);
}

/**
 * Дефекты сужения: вылет за границы секции и новые наложения.
 *
 * Наложения считаем только между TEXT-узлами и только НОВЫЕ: декор изначально
 * лежит поверх фото — это замысел, а не поломка. Рост высоты текста при
 * переносе строк дефектом не считается вовсе.
 *
 * Вылет за границу у `deco/*` и контента коллажа (`stage`) — warning: секция
 * клипает `overflow: hidden`. Для обычного содержания вылет — ошибка.
 */
export function checkStress(snapshot: StressSnapshot): Finding[] {
    const findings: Finding[] = [];
    const beforeById = byId(snapshot.before);
    const { rootAfter } = snapshot;

    for (const box of snapshot.after) {
        const wasInside = (() => {
            const b = beforeById.get(box.id);
            if (!b) return true;
            const r = snapshot.rootBefore;
            return (
                b.x >= r.x - TOLERANCE &&
                b.x + b.width <= r.x + r.width + TOLERANCE
            );
        })();

        // Ловим только тех, кто ДО ресайза помещался: декор, изначально
        // торчащий за край, — приём макета, а не дефект.
        if (!wasInside) continue;

        const overflowLeft = rootAfter.x - box.x;
        const overflowRight = box.x + box.width - (rootAfter.x + rootAfter.width);

        if (overflowLeft > TOLERANCE || overflowRight > TOLERANCE) {
            const over = Math.round(Math.max(overflowLeft, overflowRight));
            const soft = softOverflow(box.name);

            findings.push({
                rule: 'stress-overflow',
                severity: soft ? 'warning' : 'error',
                nodeId: box.id,
                path: box.name,
                message: soft
                    ? `слой коллажа/декора свисает за границу на ${over}px — секция должна клипать`
                    : `при сужении вылезает за границу секции на ${over}px`,
            });
        }
    }

    const texts = snapshot.after.filter((b) => b.type === 'TEXT');

    for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
            const a = texts[i];
            const b = texts[j];
            const aBefore = beforeById.get(a.id);
            const bBefore = beforeById.get(b.id);

            if (!aBefore || !bBefore) continue;
            if (overlaps(aBefore, bBefore)) continue; // налезали и раньше — не наш случай
            if (!overlaps(a, b)) continue;

            findings.push({
                rule: 'stress-collision',
                severity: 'error',
                nodeId: a.id,
                path: `${a.name} ✕ ${b.name}`,
                message: 'при сужении тексты наезжают друг на друга',
            });
        }
    }

    return findings;
}

export function formatReport(findings: Finding[], json: boolean): string {
    if (json) return JSON.stringify({ findings, verdict: verdict(findings) }, null, 2);

    if (findings.length === 0) return '✓ pass — нарушений нет';

    const lines = findings.map(
        (f) =>
            `${f.severity === 'error' ? '✖' : '⚠'} ${f.rule}  ${f.path} (${f.nodeId})\n    ${f.message}`,
    );
    const errors = findings.filter((f) => f.severity === 'error').length;
    const warnings = findings.length - errors;

    return (
        lines.join('\n\n') +
        `\n\n${'─'.repeat(60)}\n` +
        `${verdict(findings) === 'pass' ? '✓ pass' : '✖ fail'} — ${errors} error, ${warnings} warning`
    );
}

/** Вердикт роняют только error: warning — повод посмотреть, не повод остановиться. */
export function verdict(findings: Finding[]): 'pass' | 'fail' {
    return findings.some((f) => f.severity === 'error') ? 'fail' : 'pass';
}

function main(argv: string[]): void {
    const options = parseArgs(argv);

    try {
        const tree = evalJson<TreeNode & { error?: string }>(
            buildTreeScript(options.rootId),
        );
        if (tree.error) throw new FigmaUseError(tree.error);

        const findings = checkStructure(tree, options.width);

        if (options.stress) {
            const snapshot = evalJson<StressSnapshot>(
                buildStressScript(options.rootId, options.narrow),
            );
            if (snapshot.error) throw new FigmaUseError(snapshot.error);
            findings.push(...checkStress(snapshot));
        }

        console.log(formatReport(findings, options.json));
        if (verdict(findings) === 'fail') process.exit(1);
    } catch (error) {
        if (error instanceof FigmaUseError) {
            console.error(`✗ ${error.message}`);
            process.exit(1);
        }
        throw error;
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main(process.argv.slice(2));
}
