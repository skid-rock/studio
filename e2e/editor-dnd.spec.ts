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

    // Секции морского макета выше вьюпорта (hero ≈ 828px при 720): our-story
    // в момент захвата за экраном, и одиночный прыжок dragTo уронил бы указатель
    // обратно в hero (source === target — перестановки нет). Поэтому ведём мышь
    // руками и держим у нижней кромки, пока автоскролл dnd-kit не подвезёт цель.
    const handleBox = (await handle.boundingBox())!;
    const viewport = page.viewportSize()!;
    const edgeY = viewport.height - 20;

    await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2,
    );
    await page.mouse.down();
    // Первый сдвиг — мимо порога активации (distance ≥ 6px).
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 40, {
        steps: 5,
    });

    const centerX = Math.round(viewport.width / 2);
    let storyBox = await story.boundingBox();

    // Держим у кромки короткими шагами: автоскролл идёт, пока указатель движется.
    for (let i = 0; i < 60 && (!storyBox || storyBox.y > edgeY); i++) {
        await page.mouse.move(centerX, edgeY + (i % 2), { steps: 1 });
        await page.waitForTimeout(50);
        storyBox = await story.boundingBox();
    }

    expect(storyBox, 'автоскролл не довёз our-story во вьюпорт').toBeTruthy();

    // Цель — нижняя половина our-story, чтобы финальный индекс был после неё.
    await page.mouse.move(
        centerX,
        Math.min(storyBox!.y + storyBox!.height - 8, edgeY),
        { steps: 3 },
    );
    await page.waitForTimeout(150);
    await page.mouse.up();

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

test('кнопки Выше/Ниже: сдвигают секцию, undo, края disabled', async ({
    page,
}) => {
    const before = await blockOrder(page);
    const heroIndex = before.indexOf('hero');
    // hero не на краю сэмпла — обе кнопки должны быть доступны.
    expect(heroIndex).toBeGreaterThan(0);
    expect(heroIndex).toBeLessThan(before.length - 1);

    await page.locator('[data-block="hero"]').click();
    // Кнопки только у выделенной: после сдвига сосед может остаться под hover
    // и в DOM окажутся две ручки «Выше»/«Ниже».
    const selected = page.locator('.ch-cv-section.is-selected');
    const up = selected.getByRole('button', { name: 'Выше' });
    const down = selected.getByRole('button', { name: 'Ниже' });
    await expect(up).toBeEnabled();
    await expect(down).toBeEnabled();

    await down.click();
    await expect
        .poll(async () => (await blockOrder(page)).indexOf('hero'))
        .toBe(heroIndex + 1);

    await up.click();
    await expect
        .poll(async () => (await blockOrder(page)).indexOf('hero'))
        .toBe(heroIndex);

    // Два шага истории (Ниже, затем Выше) — один undo возвращает после Ниже.
    await page.getByRole('button', { name: 'Отменить (Cmd/Ctrl+Z)' }).click();
    await expect
        .poll(async () => (await blockOrder(page)).indexOf('hero'))
        .toBe(heroIndex + 1);
    await page.getByRole('button', { name: 'Отменить (Cmd/Ctrl+Z)' }).click();
    await expect.poll(async () => blockOrder(page)).toEqual(before);

    // Края: evaluate-клик — у конверта шторка перехватывает обычный pointer.
    const first = page.locator('.ch-cv-section').first();
    await first.evaluate((el) => {
        (el as HTMLElement).click();
    });
    await expect(
        page.locator('.ch-cv-section.is-selected').getByRole('button', {
            name: 'Выше',
        }),
    ).toBeDisabled();
    await expect(
        page.locator('.ch-cv-section.is-selected').getByRole('button', {
            name: 'Ниже',
        }),
    ).toBeEnabled();

    const last = page.locator('.ch-cv-section').last();
    await last.evaluate((el) => {
        (el as HTMLElement).click();
    });
    await expect(
        page.locator('.ch-cv-section.is-selected').getByRole('button', {
            name: 'Ниже',
        }),
    ).toBeDisabled();
    await expect(
        page.locator('.ch-cv-section.is-selected').getByRole('button', {
            name: 'Выше',
        }),
    ).toBeEnabled();
});
