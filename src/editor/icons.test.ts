import { describe, expect, it } from 'vitest';

import { defaultRegistry } from '../sections/registry.default';
import { BLOCK_ICON } from './icons';

/**
 * Машинное ограждение карты тайлов палитры (STUDIO-047).
 * Дыра: новая секция в реестре без ключа в BLOCK_ICON — карточка тихо
 * падает на 'grid', иконка «чужая», ошибок нет.
 */
describe('BLOCK_ICON — покрытие defaultRegistry', () => {
    it('у каждого mod.type из реестра есть свой ключ в карте', () => {
        const types = defaultRegistry.list().map((mod) => mod.type);
        const missing = types.filter((type) => !(type in BLOCK_ICON));

        expect(missing).toEqual([]);
    });

    it('в карте нет осиротевших ключей вне реестра', () => {
        const types = new Set(defaultRegistry.list().map((mod) => mod.type));
        const orphaned = Object.keys(BLOCK_ICON).filter((key) => !types.has(key));

        expect(orphaned).toEqual([]);
    });
});
