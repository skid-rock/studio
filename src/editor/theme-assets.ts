/**
 * CSS курированных тем для браузера через Vite ?raw (без node:fs).
 * Карта строится глобом по dist/*.css: ключ — имя файла без расширения, то есть
 * тот же id, из которого Node-путь (`tokens/theme.ts`) выводит путь к файлу.
 * Ручных импортов нет — добавление темы в THEMES не требует правки этого файла
 * (раньше забытая строка молча давала CSS дефолтной темы, STUDIO-038).
 * Покрытие реестра темами проверяет `theme-assets.test.ts`. Слой редактора/превью.
 */
import {
    DEFAULT_THEME_ID,
    THEMES,
    appendOverridesCss,
    themeById,
    type ThemePreset,
} from '../tokens/themes';
import type { ThemeRef } from '../render-core/document';

// eager: true — CSS тем нужен синхронно при первом рендере превью, без ожидания
// динамического импорта; тем единицы, вес мал.
const THEME_CSS_MODULES = import.meta.glob('../tokens/dist/*.css', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

/** id темы из пути модуля: `../tokens/dist/cream-navy.css` → `cream-navy`. */
function themeIdFromPath(path: string): string {
    const file = path.slice(path.lastIndexOf('/') + 1);

    return file.replace(/\.css$/, '');
}

export const THEME_CSS: Record<string, string> = Object.fromEntries(
    Object.entries(THEME_CSS_MODULES).map(([path, css]) => [
        themeIdFromPath(path),
        css,
    ]),
);

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
