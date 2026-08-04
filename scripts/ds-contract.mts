/**
 * Контракт эталона ДС (STUDIO-051, ADR-0007).
 *
 * Проверяет два инварианта разом:
 *   1) классы(эталон editor-mvp) == классы(src/editor/**) ⊆ классы(docs/design/styles.css)
 *   2) под src/editor/ нет своего CSS хрома — только синкнутая копия ДС в ds/
 *
 * Классы из кода снимаются статически из строковых литералов: конвенция ADR-0007 —
 * имена классов хрома всегда литералы, склейка из переменных запрещена.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(ROOT, 'docs/design/templates/editor-mvp/EditorMvp.dc.html');
const STYLES = join(ROOT, 'docs/design/styles.css');
const EDITOR = join(ROOT, 'src/editor');

/** Класс хрома: ch-* (компонент) или is-* (состояние). */
const CLASS_RE = /^(?:ch|is)-[A-Za-z0-9_-]+$/;

/** Имена классов из атрибутов class="…" эталона. */
export function classesFromTemplate(html: string): Set<string> {
    const out = new Set<string>();

    for (const m of html.matchAll(/class="([^"]*)"/g)) {
        for (const c of m[1].split(/\s+/)) {
            if (CLASS_RE.test(c)) {
                out.add(c);
            }
        }
    }

    return out;
}

/** Имена классов из селекторов таблицы ДС. */
export function classesFromCss(css: string): Set<string> {
    const out = new Set<string>();

    for (const m of css.matchAll(/\.((?:ch|is)-[A-Za-z0-9_-]+)/g)) {
        out.add(m[1]);
    }

    return out;
}

/**
 * Срезать комментарии, не задев '//' внутри URL (не после ':').
 * Без этого класс, упомянутый в комментарии в кавычках, попал бы в множество кода.
 */
function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Имена классов из строковых и шаблонных литералов одного файла. */
export function classesFromSource(src: string): Set<string> {
    const out = new Set<string>();
    const text = stripComments(src);

    for (const m of text.matchAll(/(['"`])((?:[^\\]|\\.)*?)\1/gs)) {
        for (const t of m[2].split(/[^A-Za-z0-9_-]+/)) {
            if (CLASS_RE.test(t)) {
                out.add(t);
            }
        }
    }

    return out;
}

/** Файлы кода хрома: .ts/.tsx под dir, кроме тестов и синкнутой копии ДС. */
export function sourceFiles(dir: string): string[] {
    const out: string[] = [];
    const walk = (cur: string): void => {
        for (const name of readdirSync(cur)) {
            const full = join(cur, name);

            if (statSync(full).isDirectory()) {
                if (name !== 'ds') {
                    walk(full);
                }
            } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
                out.push(full);
            }
        }
    };

    walk(dir);

    return out.sort();
}

/** Свой CSS хрома: любой .css под src/editor/ вне ds/. */
export function strayCss(dir: string): string[] {
    const out: string[] = [];
    const walk = (cur: string): void => {
        for (const name of readdirSync(cur)) {
            const full = join(cur, name);

            if (statSync(full).isDirectory()) {
                if (name !== 'ds') {
                    walk(full);
                }
            } else if (name.endsWith('.css')) {
                out.push(relative(dir, full).split('\\').join('/'));
            }
        }
    };

    walk(dir);

    return out.sort();
}

/** Сверка трёх множеств. Пустой массив — контракт соблюдён. */
export function compare(
    template: Set<string>,
    code: Set<string>,
    ds: Set<string>,
): string[] {
    const errors: string[] = [];
    const diff = (a: Set<string>, b: Set<string>): string[] =>
        [...a].filter((x) => !b.has(x)).sort();

    const missing = diff(template, code);
    const extra = diff(code, template);
    const outside = diff(code, ds);

    if (missing.length > 0) {
        errors.push(
            `есть в эталоне, нет в коде (${missing.length}): ${missing.join(', ')}`,
        );
    }
    if (extra.length > 0) {
        errors.push(
            `есть в коде, нет в эталоне (${extra.length}): ${extra.join(', ')}`,
        );
    }
    if (outside.length > 0) {
        errors.push(
            `есть в коде, нет в ДС — самодельные классы (${outside.length}): ${outside.join(', ')}`,
        );
    }

    return errors;
}

// ── Запуск (только как CLI, не при импорте из теста) ─────────────────────────

function main(): void {
    const errors: string[] = [];

    for (const [label, path] of [
        ['эталон', TEMPLATE],
        ['таблица ДС', STYLES],
    ] as const) {
        if (!existsSync(path)) {
            errors.push(`нет файла (${label}): ${relative(ROOT, path)}`);
        }
    }

    if (errors.length === 0) {
        const template = classesFromTemplate(readFileSync(TEMPLATE, 'utf8'));
        const ds = classesFromCss(readFileSync(STYLES, 'utf8'));
        const code = new Set<string>();

        for (const f of sourceFiles(EDITOR)) {
            for (const c of classesFromSource(readFileSync(f, 'utf8'))) {
                code.add(c);
            }
        }

        errors.push(...compare(template, code, ds));

        const stray = strayCss(EDITOR);

        if (stray.length > 0) {
            errors.push(
                `свой CSS хрома под src/editor/ вне ds/ (${stray.length}): ${stray.join(', ')} — ` +
                    `вёрстка хрома живёт в docs/design/, не в коде (ADR-0007)`,
            );
        }

        if (errors.length === 0) {
            console.log(
                `ds:contract — ok, ${template.size} классов: эталон == код ⊆ ДС (${ds.size}), своего CSS нет`,
            );
        }
    }

    if (errors.length > 0) {
        console.error('ds:contract — контракт эталона нарушен:\n');
        for (const e of errors) {
            console.error(`  • ${e}`);
        }
        console.error(
            '\nЭталон: docs/design/templates/editor-mvp/EditorMvp.dc.html (ADR-0007).' +
                '\nПравка вёрстки хрома начинается в docs/design/, а не в TSX.',
        );
        process.exit(1);
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main();
}
