/**
 * Копирует дизайн-систему из docs/design/ в src/editor/ds/ (STUDIO-046).
 * Правда одностороння: правится только исходник; копия — результат синка.
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DS_FILES } from './ds-files.mts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design');
const DEST = join(ROOT, 'src/editor/ds');

rmSync(DEST, { recursive: true, force: true });

for (const rel of DS_FILES) {
    const from = join(SRC, rel);
    const to = join(DEST, rel);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
}

console.log(`ds:sync — ${DS_FILES.length} файлов → ${DEST}`);
