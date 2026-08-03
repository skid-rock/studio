/**
 * Побайтовая сверка копии ДС с исходником (STUDIO-046).
 * sha256 по каждому файлу из DS_FILES; ненулевой код при расхождении.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DS_FILES } from './ds-files.mts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design');
const DEST = join(ROOT, 'src/editor/ds');

function sha256(path: string): string {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/** Все файлы под dir относительно dir (рекурсивно). */
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

const expected = new Set<string>(DS_FILES);
const errors: string[] = [];

if (!existsSync(DEST)) {
    errors.push(`нет каталога копии: ${DEST} (сначала npm run ds:sync)`);
} else {
    const actual = listFiles(DEST);

    for (const rel of actual) {
        if (!expected.has(rel)) {
            errors.push(`лишний файл в копии: ${rel}`);
        }
    }

    for (const rel of DS_FILES) {
        const srcPath = join(SRC, rel);
        const destPath = join(DEST, rel);

        if (!existsSync(srcPath)) {
            errors.push(`нет исходника: docs/design/${rel}`);
            continue;
        }
        if (!existsSync(destPath)) {
            errors.push(`нет в копии: src/editor/ds/${rel}`);
            continue;
        }

        const srcHash = sha256(srcPath);
        const destHash = sha256(destPath);
        if (srcHash !== destHash) {
            errors.push(
                `расхождение ${rel}: docs/design=${srcHash.slice(0, 12)}… ` +
                    `src/editor/ds=${destHash.slice(0, 12)}…`,
            );
        }
    }
}

if (errors.length > 0) {
    console.error('ds:check — копия ДС расходится с docs/design/:\n');
    for (const e of errors) {
        console.error(`  • ${e}`);
    }
    console.error('\nИсправьте: npm run ds:sync  (править только docs/design/)');
    process.exit(1);
}

console.log(`ds:check — ok, ${DS_FILES.length} файлов совпадают с docs/design/`);
