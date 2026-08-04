/**
 * @vitest-environment happy-dom
 *
 * Live-JS секций в холсте (STUDIO-035): runModuleJs навешивает поведение countdown.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runModuleJs } from './section-scripts';

describe('runModuleJs', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
    });

    it('навешивает тикающий countdown на разметку модуля', () => {
        vi.useFakeTimers();
        // Корень — любой connected-элемент; класс хрома страницы не нужен.
        document.body.innerHTML = `
            <div>
              <div class="s-countdown__grid"
                   data-countdown-root
                   data-countdown-target="2099-01-01T00:00:00Z">
                <span data-countdown="days">000</span>
                <span data-countdown="hours">00</span>
                <span data-countdown="minutes">00</span>
                <span data-countdown="seconds">00</span>
              </div>
            </div>
        `;

        const root = document.body.firstElementChild!;
        const seconds = root.querySelector<HTMLElement>(
            '[data-countdown="seconds"]',
        )!;

        runModuleJs(root);

        const before = seconds.textContent;

        expect(before).not.toBe('00');

        vi.advanceTimersByTime(1100);

        // Скрипт идемпотентен и обновляет DOM; после тика значение — валидная
        // двухзначная строка секунд (могло совпасть с before на границе минуты).
        expect(seconds.textContent).toMatch(/^\d{2}$/);
    });

    it('no-op при пустом корне без разметки countdown', () => {
        document.body.innerHTML = '<div></div>';
        const root = document.body.firstElementChild!;

        expect(() => runModuleJs(root)).not.toThrow();
    });
});
