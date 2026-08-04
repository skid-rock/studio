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

test('загрузка сэмпла: hero на холсте, панель выключена до выделения', async ({ page }) => {
    await expect(page.locator('[data-block="hero"]')).toBeVisible();
    // Панель не прячется и не подменяется текстом — показывает схему первой секции
    // выключенной (STUDIO-048).
    await expect(
        page.getByRole('slider', { name: 'Высота схождения' }),
    ).toBeDisabled();
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

test('снятие выделения: панель глохнет, но помнит последнюю секцию', async ({
    page,
}) => {
    await page.locator('[data-block="hero"]').click();
    const panel = page
        .getByRole('complementary')
        .filter({ has: page.getByRole('tab', { name: 'Секция' }) });
    const names = panel.getByRole('textbox', { name: 'Имена' });
    await expect(names).toBeEnabled();

    // Снятие выделения — DOM-клик по .own-canvas, а не pointer: у обёртки холста
    // сегодня нет ни одного своего пикселя (её рект совпадает с .own-page, гаттеры
    // принадлежат main.ch-ed-canvas), поэтому мышью до select(null) не дотянуться.
    // Проверяем память панели, а не попадание по фону — зона холста в STUDIO-049.
    await page.locator('.own-canvas').evaluate((el) => {
        (el as HTMLElement).click();
    });

    // Правило «выделенная → последняя выделенная → первая в документе»: разметка
    // та же, заголовок прежний, поля выключены (STUDIO-048). Первая секция
    // документа — конверт, так что hero тут доказывает именно память панели.
    await expect(panel.locator('.ch-panel__title')).toHaveText(
        'Hero (имена и дата)',
    );
    await expect(names).toBeDisabled();
    await expect(
        panel.getByText('Ничего не выделено', { exact: false }),
    ).toBeVisible();
});

test('вкладки: переключение не сбрасывает выделение секции', async ({
    page,
}) => {
    await page.locator('[data-block="hero"]').click();
    // complementary — и палитра, и правая панель; сужаем по вкладкам.
    const panel = page
        .getByRole('complementary')
        .filter({ has: page.getByRole('tab', { name: 'Секция' }) });
    const names = panel.getByRole('textbox', { name: 'Имена' });
    await expect(names).toBeEnabled();
    await expect(
        panel.locator('.ch-panel__title'),
    ).toHaveText('Hero (имена и дата)');

    await page.getByRole('tab', { name: 'Страница' }).click();
    await expect(page.getByLabel('Тема')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Экспорт HTML' }),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Секция' }).click();
    await expect(names).toBeEnabled();
    await expect(
        panel.locator('.ch-panel__title'),
    ).toHaveText('Hero (имена и дата)');
});

test('пустой документ: панель показывает «нет секций»', async ({ page }) => {
    // Pointer-клик по тулбару нестабилен: у конверта modal-оверлей и tall
    // секция уезжают из viewport. Удаляем через DOM-click кнопки — проверяем
    // именно пустое состояние панели, не hover-тулбар.
    const sections = page.locator('.own-section');
    const count = await sections.count();

    for (let i = 0; i < count; i++) {
        await sections.last().evaluate((el) => {
            const btn = el.querySelector(
                '[aria-label="Удалить секцию"]',
            ) as HTMLButtonElement | null;
            btn?.click();
        });
    }

    await expect(page.locator('[data-section-id]')).toHaveCount(0);
    await expect(page.getByText('В документе нет секций')).toBeVisible();
    await expect(
        page.getByText(
            'Добавьте блок из палитры — панель покажет его поля',
        ),
    ).toBeVisible();
});

test('экспорт: вес в бюджете 190 KiB, якоря разметки на месте', async ({ page }) => {
    // Экспорт показывает alert — регистрируем обработчик ДО клика
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
        dialogs.push(dialog.message());
        void dialog.accept();
    });

    await page.getByRole('tab', { name: 'Страница' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Экспорт HTML' }).click();
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
