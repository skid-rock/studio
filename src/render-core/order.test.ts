import { describe, expect, it } from 'vitest';

import { orderBetween } from './order';

describe('orderBetween', () => {
    it('генерирует ключ между двумя соседями', () => {
        const key = orderBetween('a0', 'a1');
        expect(key > 'a0').toBe(true);
        expect(key < 'a1').toBe(true);
    });

    it('генерирует первый ключ при пустых границах', () => {
        const key = orderBetween(null, null);
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
    });

    it('генерирует ключ в начало списка', () => {
        const key = orderBetween(null, 'a0');
        expect(key < 'a0').toBe(true);
    });

    it('генерирует ключ в конец списка', () => {
        const key = orderBetween('a1', null);
        expect(key > 'a1').toBe(true);
    });
});
