// e2e-смоук собственного редактора (STUDIO-036): машинное ограждение
// поверх ручного чеклиста паритета STUDIO-035.
import { readFileSync } from 'node:fs';

import { test, expect } from '@playwright/test';

// Бюджет веса экспорта — тот же, что в src/editor/export-html.ts
const BUDGET_BYTES = 190 * 1024;

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Стартовая загрузка: 10 секций сэмпла видны на холсте
    await expect(page.locator('[data-section-id]')).toHaveCount(10);
});

test('загрузка сэмпла: hero на холсте, панель пустая до выделения', async ({ page }) => {
    await expect(page.locator('[data-block="hero"]')).toBeVisible();
    await expect(page.getByText('Выберите секцию на холсте')).toBeVisible();
});

test('панель свойств: несколько символов подряд без потери фокуса', async ({ page }) => {
    // Клик по содержимому всплывает в обёртку секции и выделяет её.
    await page.locator('[data-block="hero"]').click();
    const names = page.getByRole('textbox', { name: 'Имена' });
    await expect(
        page
            .getByRole('complementary')
            .filter({ has: names })
            .getByText('Hero (имена и дата)', { exact: true }),
    ).toBeVisible();
    await names.click();
    // Регресс класса фокус-багов (docs/improvements/bugs.md): если фокус слетает
    // после символа, часть последовательности не попадёт в поле
    await names.pressSequentially('12345', { delay: 50 });
    await expect(names).toBeFocused();
    await expect(names).toHaveValue(/12345/);
    // Правка из панели видна на холсте
    await expect(page.locator('[data-block="hero"] [data-prop="names"]')).toContainText('12345');
});

test('inline-правка на холсте + undo/redo (кнопки и хоткей)', async ({ page }) => {
    // Сначала выделить секцию: клик по date внутри невыделенной секции
    // всплывает в store.select → re-render BlockPreview сбрасывает фокус
    // contentEditable до набора (dangerouslySetInnerHTML).
    await page.locator('[data-block="hero"]').click();
    await expect(page.getByRole('textbox', { name: 'Имена' })).toBeVisible();

    const date = page.locator('[data-block="hero"] [data-prop="date"]');
    const before = (await date.textContent()) ?? '';

    await date.click();
    await expect(date).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('01.01.2030');
    // Enter без Shift = blur = коммит inline-правки в стор
    await page.keyboard.press('Enter');
    await expect(date).toHaveText('01.01.2030');

    await page.getByRole('button', { name: 'Отменить (Cmd/Ctrl+Z)' }).click();
    await expect(date).toHaveText(before);
    await page
        .getByRole('button', { name: 'Повторить (Shift+Cmd/Ctrl+Z)' })
        .click();
    await expect(date).toHaveText('01.01.2030');
    // Хоткей: фокус вне contentEditable, слушатель на window сработает
    await page.keyboard.press('ControlOrMeta+z');
    await expect(date).toHaveText(before);
});

test('экспорт: вес в бюджете 190 KiB, якоря разметки на месте', async ({ page }) => {
    // Экспорт показывает alert — регистрируем обработчик ДО клика
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
        dialogs.push(dialog.message());
        void dialog.accept();
    });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Экспорт' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('index.html');

    const filePath = await download.path();
    const html = readFileSync(filePath!, 'utf-8');

    // Вес — независимо от alert, тем же способом, что buildExportHtml
    expect(new TextEncoder().encode(html).length).toBeLessThanOrEqual(BUDGET_BYTES);

    // Ключевые якоря экспортированной разметки
    expect(html.toLowerCase()).toContain('<!doctype html>');
    expect(html).toContain('data-prop="names"');
    expect(html).toContain('data-prop="date"');
    expect(html).toContain('data-prop="title"');

    // alert подтвердил бюджет
    expect(dialogs.join('\n')).toContain('в бюджете');
    expect(dialogs.join('\n')).not.toContain('ПРЕВЫШЕН');
});
