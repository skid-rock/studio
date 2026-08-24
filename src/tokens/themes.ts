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
    { id: 'marine', name: 'Marine' },
];

/** Тема по умолчанию (фолбэк для неизвестного id). */
export const DEFAULT_THEME_ID = THEMES[0].id;

/** Выбрать значение из карты по id темы с фолбэком на дефолт. */
export function themeById<T>(map: Record<string, T>, id: string): T {
    return map[id] ?? map[DEFAULT_THEME_ID];
}

/**
 * Дописать к CSS темы хвост `:root { … }` с точечными оверрайдами переменных.
 * Чистая строковая операция (без fs/DOM) — общий код для Node-экспорта и браузера.
 * Ключи без префикса `--` нормализуются. Пустой объект → baseCss без изменений.
 */
export function appendOverridesCss(
    baseCss: string,
    overrides?: Record<string, string>,
): string {
    if (!overrides || Object.keys(overrides).length === 0) {
        return baseCss;
    }

    const vars = Object.entries(overrides)
        .map(([key, value]) => {
            const name = key.startsWith('--') ? key : `--${key}`;

            return `  ${name}: ${value};`;
        })
        .join('\n');

    return `${baseCss}\n:root {\n${vars}\n}`;
}

/**
 * Прочитать итоговое значение CSS-переменной из строки темы.
 * Собирает карту `--x: y` из CSS и резолвит цепочку алиасов `var(--other)`
 * (в пресетах встречается, напр. `--color-text: var(--color-navy)`).
 * Чистая строковая операция (без DOM) — нужна для дефолта свотча в редакторе.
 * Возвращает undefined, если переменная не найдена. Лимит глубины — защита от
 * циклических ссылок.
 */
export function resolveCssVar(css: string, name: string): string | undefined {
    const map = new Map<string, string>();
    const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(css)) !== null) {
        map.set(m[1], m[2].trim());
    }

    let key = name.startsWith('--') ? name : `--${name}`;

    for (let depth = 0; depth < 10; depth++) {
        const value = map.get(key);

        if (value === undefined) {
            return undefined;
        }
        const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);

        if (!ref) {
            return value;
        }
        key = ref[1];
    }

    return undefined;
}
