/**
 * STUDIO-048: правило выбора схемы панели — выделенная → последняя → первая.
 */
import { describe, expect, it } from 'vitest';

import { resolveShownSection } from './resolve-shown-section';

const list = [
    { id: 'a', type: 'intro/envelope' },
    { id: 'b', type: 'hero' },
    { id: 'c', type: 'schedule' },
];

describe('resolveShownSection', () => {
    it('при выделении возвращает выделенную секцию', () => {
        expect(resolveShownSection(list, 'b', 'a')?.id).toBe('b');
    });

    it('без выделения — последняя выделенная, если она ещё в документе', () => {
        expect(resolveShownSection(list, null, 'c')?.id).toBe('c');
    });

    it('без выделения и без last — первая в списке', () => {
        expect(resolveShownSection(list, null, null)?.id).toBe('a');
    });

    it('last указывает на удалённую — падает на первую в списке', () => {
        expect(resolveShownSection(list, null, 'gone')?.id).toBe('a');
    });

    it('пустой документ — undefined', () => {
        expect(resolveShownSection([], null, 'a')).toBeUndefined();
        expect(resolveShownSection([], 'a', 'a')).toBeUndefined();
    });
});
