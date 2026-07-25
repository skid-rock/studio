import { describe, expect, it } from 'vitest';

import { THEMES, THEME_CSS } from './theme-assets';

/**
 * Машинное ограждение синхронности реестра тем и карты CSS редактора.
 * Дыра, которую закрываем: тема добавлена в THEMES, но её CSS не попал в карту —
 * `themeById` тихо отдаёт CSS дефолтной темы, редактор показывает не ту тему,
 * ошибок нет (наступили на этом с pearl-beige, STUDIO-038).
 *
 * Проверяются только ключи: под vitest CSS отключён, и `?raw` отдаёт пустую
 * строку для любого .css (проверено и на прямом импорте, не только на глобе).
 * Содержимое тем проверяет `src/tokens/themes.test.ts` — там чтение dist через
 * node:fs, мимо трансформа Vite.
 */
describe('THEME_CSS — покрытие реестра THEMES', () => {
    it('множество ключей карты совпадает с id из THEMES', () => {
        const registryIds = THEMES.map((t) => t.id).sort();
        const cssIds = Object.keys(THEME_CSS).sort();

        // Расхождение в любую сторону — сигнал: слева не собран dist/<id>.css
        // (`npm run tokens`), справа — осиротевший файл удалённой темы.
        expect(cssIds).toEqual(registryIds);
    });

    it('карта не пуста (глоб нашёл собранные темы)', () => {
        expect(Object.keys(THEME_CSS).length).toBeGreaterThanOrEqual(3);
    });
});
