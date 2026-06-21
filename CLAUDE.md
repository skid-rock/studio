# CLAUDE.md — контекст проекта studio

Проектный контекст для ИИ. **Дополняет** глобальный `~/.claude/CLAUDE.md` (правила
общения/стиля), не дублируя его — здесь только специфика studio.

studio — конструктор лендингов: визуальный редактор на React, выходной артефакт —
лёгкий HTML/CSS, агностичный к React.

## Правило границ (главный инвариант)

`src/render-core/` и `src/sections/` **не импортируют** React, `react-dom`,
`@measured/puck`, `../editor`. React и Puck — только в `src/editor/` и точке входа
`src/main.tsx`. В `src/editor/` импорты из Puck — `import type`, кроме `Editor.tsx`.

Граница **проверяется машинно**: ESLint-правило `no-restricted-imports` (scoped на
`render-core/`/`sections/`, STUDIO-027) валит `make lint` при импорте React/движка в
ядро. Любое предложение, тянущее React/движок в ядро или секции, — нарушение.

## Где что лежит

- `src/render-core/` — агностичное ядро: модель (`document.ts`), zod-валидация
  (`document.schema.ts`), схема параметров (`schema.ts`), реестр (`registry.ts`),
  render (`render.ts`), сборка страницы (`page.ts`), дробный порядок (`order.ts`).
- `src/sections/` — модули блоков (`intro-envelope`, `hero`, `closing`) +
  `registry.default.ts`. Зависит от `render-core`, не наоборот.
- `src/tokens/` — токены темы (DTCG JSON → CSS через Style Dictionary), `theme.ts`.
- `src/editor/` — React-оболочка на Puck (driving-адаптер): `Editor.tsx`,
  `puck-adapter.ts`, `block-preview.tsx`, `fields-from-schema.ts`.
- `docs/adr/` — принятые решения; `docs/improvements/` — роадмапы и техдолг.

Полная карта слоёв и поток данных — [docs/architecture.md](docs/architecture.md).

## Ключевые инварианты

- **Источник правды — `StudioDocument`** (`src/render-core/document.ts`). Редактор
  его лишь маппит в/из Puck; правки идут в документ.
- **Render — чистая строка HTML**, агностичная к React: `RenderFn = (props, ctx) =>
  string`, без `document`/`window`/DOM (работает и в Node).
- **Один путь рендера**: `renderDocument` используется и в превью, и в экспорте.
  Превью в редакторе оборачивает тот же `mod.render` (`BlockPreview`), второго пути
  разметки нет (анти-drift).
- **Прод-экспорт без React**: выходной артефакт — HTML/CSS, без рантайма студии.
- **Неизвестный тип секции не роняет render** — `renderDocument` вставляет
  HTML-комментарий-заглушку.

## Конвенции

- Комментарии в коде — **на русском**.
- Решения фиксируются через **ADR** в `docs/adr/` (почему так).
- Техдолг — `docs/improvements/backlog.md` (IMP-xxx).
- Роадмапы — `docs/improvements/roadmap-*.md` (control — границы/ограждения,
  docs — документация).
- **Тесты не трогаем без явного «да»** — не писать и не менять без подтверждения.

## Задачи и планы реализации

Задачи проекта живут **в gd-brain** (кросс-репо), не в этом репозитории:
`gd-brain/tasks/studio/` (соседний репозиторий, путь от корня studio —
`../gd-brain/tasks/studio/`). Формат id — `STUDIO-NNN`.

- **Карточка** задачи — `gd-brain/tasks/studio/STUDIO-NNN/index.md` (frontmatter +
  тело: «Состояние», «Что делаем», DoD/чеклист).
- **План реализации** — `gd-brain/tasks/studio/STUDIO-NNN/analysis/implementation-plan.md`:
  **самодостаточный** документ-исполнитель (точные пути файлов, готовый код ключевых
  кусков, команды проверки, «что НЕ делать», DoD). Исполняется буквально, без доступа
  к диалогу, в котором создавался.
- **Канон** формата и процесса — `gd-brain/tasks/README.md`, разделы «Workflow» и
  «Планы реализации» (там же обязательная шапка-маркер плана).
- **Образец** хорошего плана — `gd-brain/tasks/studio/STUDIO-009` (детальный
  вертикальный срез).
- Статус карточки и `gd-brain/tasks/statuses.md` обновляются по ходу работы (см. канон).

## Ссылки

- [docs/architecture.md](docs/architecture.md) — карта слоёв, зависимости, поток данных (D1).
- [docs/glossary.md](docs/glossary.md) — словарь терминов (D2).
- [README.md](README.md) — команды, карта папок, список ADR.
