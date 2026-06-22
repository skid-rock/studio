/**
 * Реестр курированных тем: id (= имя файла dist/<id>.css) + человекочитаемое имя.
 * Агностичный модуль: без React/DOM/fs — общий для билда токенов (Node) и
 * переключателя в редакторе (браузер).
 */
export interface ThemePreset {
    id: string;
    name: string;
}

export const THEMES: ThemePreset[] = [
    { id: 'cream-navy', name: 'Cream & Navy' },
    { id: 'forest-blush', name: 'Forest & Blush' },
    { id: 'charcoal-gold', name: 'Charcoal & Gold' },
];

/** Тема по умолчанию (фолбэк для неизвестного id). */
export const DEFAULT_THEME_ID = THEMES[0].id;

/** Выбрать значение из карты по id темы с фолбэком на дефолт. */
export function themeById<T>(map: Record<string, T>, id: string): T {
    return map[id] ?? map[DEFAULT_THEME_ID];
}
