// e2e палитры на ch-block-card (STUDIO-047): карточки с тайлами и клавиатура.
import { test, expect } from '@playwright/test';

/** Палитра блоков — левый complementary с заголовком «Блоки». */
function palette(page: import('@playwright/test').Page) {
    return page
        .getByRole('complementary')
        .filter({ has: page.getByText('Блоки', { exact: true }) });
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-section-id]')).toHaveCount(10);
});

test('палитра: 13 карточек, у каждой svg-тайл', async ({ page }) => {
    const cards = palette(page).getByRole('button');

    await expect(cards).toHaveCount(13);

    for (const card of await cards.all()) {
        await expect(card.locator('svg')).toHaveCount(1);
    }
});

test('палитра: Tab → Enter вставляет секцию', async ({ page }) => {
    // Порядок Tab: первые фокусируемые — карточки палитры (tabindex=0).
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');

    await expect(focused).toHaveClass(/ch-block-card/);
    await page.keyboard.press('Enter');

    // Вставка первой карточки (конверт) — на холсте ещё один блок.
    await expect(page.locator('[data-section-id]')).toHaveCount(11);
});

test('палитра: Space на карточке тоже вставляет секцию', async ({ page }) => {
    const card = palette(page).getByRole('button', {
        name: 'Контакты (организатор)',
    });

    await card.focus();
    await page.keyboard.press('Space');

    await expect(page.locator('[data-section-id]')).toHaveCount(11);
    await expect(page.locator('[data-block="contacts"]')).toBeVisible();
});
