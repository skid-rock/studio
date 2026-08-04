// e2e перестановки секций через dnd-kit (STUDIO-037): мышь и клавиатура.
import { test, expect } from '@playwright/test';

/** Порядок типов блоков на холсте (сверху вниз). */
async function blockOrder(page: import('@playwright/test').Page): Promise<string[]> {
    return page
        .locator('[data-block]')
        .evaluateAll((els) =>
            els.map((el) => el.getAttribute('data-block') ?? ''),
        );
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-section-id]')).toHaveCount(10);
});

test('DnD мышью: hero уезжает ниже our-story, undo откатывает', async ({
    page,
}) => {
    const before = await blockOrder(page);
    expect(before.indexOf('hero')).toBeLessThan(before.indexOf('our-story'));

    // data-block — атрибут содержимого (render-core), не хром редактора.
    const hero = page.locator('[data-block="hero"]');
    const story = page.locator('[data-block="our-story"]');

    // Тулбар виден при hover; drag стартует только с ручки (distance ≥ 6px).
    await hero.hover();
    // Мини-тулбар рендерится только у наведённой/выделенной секции — ручка в DOM одна.
    const handle = page.getByRole('button', { name: 'Перетащить секцию' });
    await expect(handle).toBeVisible();

    const storyBox = await story.boundingBox();
    expect(storyBox).toBeTruthy();

    // Цель — нижняя половина our-story, чтобы финальный индекс был после неё.
    await handle.dragTo(story, {
        targetPosition: {
            x: storyBox!.width / 2,
            y: storyBox!.height - 8,
        },
        force: true,
    });

    await expect
        .poll(async () => {
            const order = await blockOrder(page);

            return order.indexOf('hero') > order.indexOf('our-story');
        })
        .toBe(true);

    await page.getByRole('button', { name: 'Отменить (Cmd/Ctrl+Z)' }).click();
    await expect
        .poll(async () => blockOrder(page))
        .toEqual(before);
});

test('DnD клавиатурой: Space + ArrowDown перемещает секцию', async ({
    page,
}) => {
    const before = await blockOrder(page);
    const heroIndex = before.indexOf('hero');
    expect(heroIndex).toBeGreaterThanOrEqual(0);

    const hero = page.locator('[data-block="hero"]');

    // Тулбар виден у выделенной секции — иначе кнопка display:none и не в tab-order.
    await hero.click();
    const handle = page.getByRole('button', { name: 'Перетащить секцию' });
    await expect(handle).toBeVisible();
    await handle.focus();

    // Паттерн dnd-kit KeyboardSensor: Space/Enter — захват, стрелки — сдвиг, Space — сброс.
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await expect
        .poll(async () => {
            const order = await blockOrder(page);

            return order.indexOf('hero');
        })
        .toBe(heroIndex + 1);

    // Esc-отмена на уже завершённом drag не нужна; проверяем undo.
    await page.keyboard.press('ControlOrMeta+z');
    await expect
        .poll(async () => blockOrder(page))
        .toEqual(before);
});

test('клик по ручке без движения не создаёт шаг undo', async ({ page }) => {
    const before = await blockOrder(page);

    const hero = page.locator('[data-block="hero"]');
    await hero.click();
    const handle = page.getByRole('button', { name: 'Перетащить секцию' });
    await handle.click();

    // Порядок не менялся; undo остаётся недоступным (нет нового шага истории).
    await expect(await blockOrder(page)).toEqual(before);
    await expect(
        page.getByRole('button', { name: 'Отменить (Cmd/Ctrl+Z)' }),
    ).toBeDisabled();
});
