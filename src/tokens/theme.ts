import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ThemeRef } from '../render-core/document';
import { appendOverridesCss } from './themes';

const THEMES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'dist');

/** Путь к сгенерированному CSS темы: dist/${themeId}.css */
export function themeCssPath(themeId: string): string {
    return join(THEMES_DIR, `${themeId}.css`);
}

/** Загрузить CSS темы по id (напр. "cream-navy"). */
export function loadThemeCss(themeId: string): string {
    return readFileSync(themeCssPath(themeId), 'utf8');
}

/** CSS темы с точечными оверрайдами из документа. */
export function resolveThemeCss(theme: ThemeRef): string {
    return appendOverridesCss(loadThemeCss(theme.id), theme.overrides);
}
