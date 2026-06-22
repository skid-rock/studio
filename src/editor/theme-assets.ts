/**
 * CSS курированных тем для браузера через Vite ?raw (без node:fs).
 * Карта по id; ключи совпадают с реестром THEMES. Слой редактора/превью.
 */
import {
    DEFAULT_THEME_ID,
    THEMES,
    appendOverridesCss,
    themeById,
    type ThemePreset,
} from '../tokens/themes';
import type { ThemeRef } from '../render-core/document';

import creamNavyCss from '../tokens/dist/cream-navy.css?raw';
import forestBlushCss from '../tokens/dist/forest-blush.css?raw';
import charcoalGoldCss from '../tokens/dist/charcoal-gold.css?raw';

export const THEME_CSS: Record<string, string> = {
    'cream-navy': creamNavyCss,
    'forest-blush': forestBlushCss,
    'charcoal-gold': charcoalGoldCss,
};

/** CSS темы по id с безопасным фолбэком на дефолт. */
export function themeCssById(id: string): string {
    return themeById(THEME_CSS, id);
}

/** CSS темы по ThemeRef (id + оверрайды) для превью редактора. */
export function resolveThemeCss(theme: ThemeRef): string {
    return appendOverridesCss(themeCssById(theme.id), theme.overrides);
}

export { DEFAULT_THEME_ID, THEMES };
export type { ThemePreset };
