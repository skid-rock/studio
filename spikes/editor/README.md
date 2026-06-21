# Спайк: основа визуального редактора (STUDIO-008)

Одноразовый спайк к [ADR-0004](../../docs/adr/ADR-0004-editor-base.md). Проверяет
гипотезу: **Puck** годится как база DnD-редактора Фазы 1 поверх нашего
**агностичного** строкового render (ADR-0002), без второго пути рендера и без
React в прод-выводе.

> Не продакшн-код. Живёт в `spikes/`, вне `src/`, исключён из прод-сборки
> (корневой `tsconfig` не включает `spikes`), линта (`eslint.config.js`
> игнорирует `spikes`) и тестового прогона (`vitest` берёт только `src/**`).

## Что показано

| Критерий ADR                                        | Где видно                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Модель Puck ↔ `StudioDocument`/`SectionNode[]`      | `puck-adapter.tsx` → `documentToPuck` / `puckToDocument`; round-trip в `verify.mts`                                              |
| Панель свойств из нашей `ParamSchema`               | `fieldsFromSchema` (range→number, text→textarea, select→select, color→custom `<input type=color>`); скрин `screenshots/02-*.png` |
| Превью через агностичный render                     | `BlockPreview` зовёт `mod.render(props, ctx)` → `dangerouslySetInnerHTML`; скрин `screenshots/01-*.png`                          |
| DnD: добавить/переставить/удалить + дробный `order` | палитра/Outline Puck; `verify.mts` (add + reorder, order пересчитан через fractional-indexing)                                   |
| Экспорт остаётся агностичным                        | кнопка «Экспорт» в `App.tsx` гонит `renderDocument` → строка HTML без React; `verify.mts` [4]                                    |
| Анти-drift (один путь рендера)                      | `verify.mts` [5]: `renderToStaticMarkup(BlockPreview)` содержит ровно строковый `mod.render`                                     |

## Запуск

```bash
# интерактивный редактор в браузере
npm run spike            # → http://localhost:5173 (Vite)

# headless-проверка адаптера (без браузера), печатает PASS/FAIL
npm run spike:verify
```

## Файлы

- `puck-adapter.tsx` — мост: `ParamSchema`→поля Puck, `BlockModule`→Puck-конфиг
  (render = React-обёртка над нашим строковым render), `StudioDocument`↔Puck `Data`.
- `App.tsx` — оболочка редактора (`<Puck>`) + инъекция темы/CSS + кнопка экспорта.
- `verify.mts` — воспроизводимое доказательство сценария без браузера.
- `main.tsx` / `index.html` / `vite.config.ts` / `tsconfig.json` — обвязка запуска.
- `screenshots/` — снимки рабочего редактора и панели из `ParamSchema`.

## Замечания (для Фазы 1)

- Конверт в проде — полноэкранный `position: fixed` оверлей; в холсте редактора
  он нейтрализуется локальным CSS (`App.tsx`, `.spike-block`). В Фазе 1 нужен
  honest «режим холста» для full-bleed секций.
- `img/seal.png` берётся из реального `public/` (через `publicDir` в
  `vite.config.ts`); вне dev-сервера путь относительный.
- Тип с `/` («intro/envelope») экранируется в Puck-ключ (`intro--envelope`) и
  возвращается обратно при маппинге — Puck кладёт `type` в DOM-id.
