/**
 * Приём обновления ДС: sync → check → эвристики состава → verify.
 * Сводка для отчёта агента (канал «архив» / DesignSync). См. ADR-0006.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DS_FILES } from './ds-files.mts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = join(ROOT, 'docs/design');

type StepResult = { name: string; ok: boolean; detail?: string };

function runNpm(script: string): StepResult {
    const r = spawnSync('npm', ['run', script], {
        cwd: ROOT,
        encoding: 'utf8',
        shell: process.platform === 'win32',
    });
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
    const last = out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(-3)
        .join(' | ');
    return {
        name: `npm run ${script}`,
        ok: r.status === 0,
        detail: last || `exit ${r.status ?? 'null'}`,
    };
}

/** Файлы под dir относительно dir. */
function listFiles(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    const out: string[] = [];
    const walk = (cur: string): void => {
        for (const name of readdirSync(cur)) {
            const full = join(cur, name);
            if (statSync(full).isDirectory()) {
                walk(full);
            } else {
                out.push(relative(dir, full).split('\\').join('/'));
            }
        }
    };
    walk(dir);
    return out.sort();
}

/** url()/ @import из CSS, которые указывают на assets или styles. */
function referencedFromStyles(): string[] {
    const refs = new Set<string>();
    const cssRel = ['styles.css', 'styles/chrome-fonts.css', 'styles/chrome-tokens.css'];
    const reUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    const reImport = /@import\s+['"]([^'"]+)['"]/g;

    for (const rel of cssRel) {
        const path = join(DESIGN, rel);
        if (!existsSync(path)) {
            continue;
        }
        const text = readFileSync(path, 'utf8');
        const baseDir = dirname(rel);

        for (const re of [reUrl, reImport]) {
            re.lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = re.exec(text)) !== null) {
                const raw = m[1].trim();
                if (raw.startsWith('data:') || raw.startsWith('http')) {
                    continue;
                }
                // нормализуем относительно docs/design
                const joined = join(baseDir, raw).split('\\').join('/');
                const norm = joined.replace(/^\.\//, '').replace(/\/\.\//g, '/');
                refs.add(norm);
            }
        }
    }
    return [...refs].sort();
}

const steps: StepResult[] = [];
const warnings: string[] = [];

console.log('=== ds:intake — приём обновления ДС ===\n');
console.log(`SoT: docs/design/  →  продукт: src/editor/ds/`);
console.log(`DS_FILES: ${DS_FILES.length} файлов\n`);

steps.push(runNpm('ds:sync'));
steps.push(runNpm('ds:check'));

const allDesign = listFiles(DESIGN);
const productish = allDesign.filter(
    (f) =>
        f === 'styles.css' ||
        f.startsWith('styles/chrome-') ||
        f.startsWith('assets/fonts/'),
);
const missingInDsFiles = productish.filter((f) => !(DS_FILES as readonly string[]).includes(f));
if (missingInDsFiles.length > 0) {
    warnings.push(
        `в docs/design есть кандидаты в продукт вне DS_FILES: ${missingInDsFiles.join(', ')}`,
    );
}

const refs = referencedFromStyles();
const missingRefs = refs.filter((f) => {
    if (!(DS_FILES as readonly string[]).includes(f)) {
        // docs.css и прочие витринные — не для продукта
        if (f.includes('docs.css')) {
            return false;
        }
        // ссылка должна существовать на диске
        return existsSync(join(DESIGN, f));
    }
    return false;
});
for (const f of missingRefs) {
    if (f.startsWith('assets/') || f.startsWith('styles/chrome-')) {
        warnings.push(`CSS ссылается на ${f}, но файла нет в DS_FILES — допишите scripts/ds-files.mts`);
    }
}

steps.push(runNpm('verify'));

console.log('\n--- шаги ---');
for (const s of steps) {
    console.log(`${s.ok ? 'ok' : 'FAIL'}  ${s.name}${s.detail ? `  (${s.detail})` : ''}`);
}

if (warnings.length > 0) {
    console.log('\n--- предупреждения ---');
    for (const w of warnings) {
        console.log(`! ${w}`);
    }
}

const failed = steps.filter((s) => !s.ok);
console.log('\n--- вердикт ---');
if (failed.length === 0 && warnings.length === 0) {
    console.log('принято: sync/check/verify зелёные, состав DS_FILES без замечаний');
} else if (failed.length === 0) {
    console.log('принято с предупреждениями — см. выше; занесите в отчёт intake');
} else {
    console.log(`не принято: упали ${failed.map((s) => s.name).join(', ')}`);
}

console.log(
    '\nШаблон отчёта: ../gd-brain/docs/studio/ds-intake-report-template.md\n' +
        'Коммит — только по запросу владельца.',
);

process.exit(failed.length > 0 ? 1 : 0);
