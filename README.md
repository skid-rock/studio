# studio

Конструктор лендингов (личный/агентский инструмент). Редактор на React, выходной
render — лёгкий и агностичный к React. Маршрут развития —
[роадмап в gd-brain](../gd-brain/docs/studio/roadmap.md).

> Статус: Фаза 1 (визуальный редактор) — собственный редактор на `editor-core` +
> React-UI (`src/editor/`). Puck удалён (STUDIO-035). Готово: ядро рендера, DnD
> секций, автопанель свойств, inline-правка, темы, сохранение/экспорт.

## Команды

```bash
make install   # установить зависимости
make dev       # dev-сервер (Vite)
make build     # проверка типов + production-сборка
make preview   # предпросмотр сборки
make lint      # ESLint
make format    # Prettier
make clean     # удалить node_modules и dist
```

`make help` — список всех команд. Под капотом — npm-скрипты (`dev`, `build`,
`preview`, `lint`, `format`, `verify`, `export`, `ds:sync`, `ds:check`,
`ds:intake`).

### Дизайн-система хрома

**Источник истины — `docs/design/`.** Claude Design — поверхность; продукт читает
копию в `src/editor/ds/` ([ADR-0006](docs/adr/ADR-0006-chrome-ds-consumption.md),
[D9](../gd-brain/docs/strategy/decisions/2026-08-03-claude-design-channel.md)).

Два канала обновления:

1. **DesignSync** (основной) — паритет репо ↔ проект «Studio» в Claude Design
   (`list_files` → `finalize_plan` → `write_files`; проверка — `get_file` + sha256).
2. **Архив** — распаковать в `docs/design/` и сказать агенту («ДС приземлена»);
   агент гоняет intake и отдаёт отчёт.

```bash
make ds-sync     # обновить копию src/editor/ds/
make ds-check    # побайтовая сверка (входит в verify)
make ds-intake    # sync + check + verify + сводка для отчёта
```

Править только `docs/design/`; правка копии — ошибка. Новый файл для продукта —
дописать `scripts/ds-files.mts`. Шаблон отчёта —
[`gd-brain/docs/studio/ds-intake-report-template.md`](../gd-brain/docs/studio/ds-intake-report-template.md).
Гид по классам и токенам — [`docs/design/readme.md`](docs/design/readme.md).

### Перенос секции из Figma

Обвязка над CLI [`figma-use`](https://github.com/dannote/figma-use) — канал
design→code (решение D8 в gd-brain). Требует Figma desktop, поднятой с
`--remote-debugging-port=9222`; проверка живости — `figma-use status`.

```bash
# инвентарь фрейма одним вызовом: sizing, выравнивание, повороты,
# эффекты, скругления, типографика, bbox + renderBounds
make figma-inventory ARGS="32:127"
make figma-inventory ARGS="32:127 --depth 2 --out /tmp/section.json"

# растровый ассет в 2x (флаг --scale у самого figma-use не работает)
make figma-export ARGS="238:2 public/img/dress-code/shell-rings.png"
make figma-export ARGS="238:2 icon.svg --format SVG"

# линт макета пресетом studio — перед переносом секции
make figma-lint PAGE="Sections"
make figma-lint ARGS="--root 32:127"

# структура секции + машинный стресс-тест сужения до 320
make figma-check ARGS="--root 32:127"
```

Скрипты — [`scripts/figma/`](scripts/figma/); состав и обоснование пресета
линта — [docs/figma-lint-preset.md](docs/figma-lint-preset.md); пошаговый порядок
работ — рецепт переноса секции в gd-brain
(`docs/knowledge/tools/figma/figma-to-studio-recipe.md`).

## Карта папок

```
studio/
├─ docs/adr/            ADR-решения
├─ src/
│  ├─ main.tsx          точка входа (свой редактор)
│  ├─ editor-core/      агностичный стор редактора
│  ├─ editor/           React-UI редактора (+ ds/ — синк ДС хрома)
│  ├─ render-core/      агностичный render + реестр блоков
│  ├─ sections/         модули секций лендинга
│  └─ tokens/           токены темы (DTCG → CSS)
├─ index.html
├─ vite.config.ts
└─ Makefile
```

## Решения (ADR)

- [ADR-0001](docs/adr/ADR-0001-repo-structure.md) — структура репозитория: один
  пакет (не монорепо).
- [ADR-0002](docs/adr/ADR-0002-render-contract.md) — контракт агностичного render
  (`(props, ctx) → строка HTML`); один путь рендера для превью и прода.
- [ADR-0003](docs/adr/ADR-0003-schema-format.md) — формат схемы параметров блока
  (собственная `ParamSchema`).
- [ADR-0004](docs/adr/ADR-0004-editor-base.md) — основа редактора на Puck
  (superseded ADR-0005).
- [ADR-0005](docs/adr/ADR-0005-editor-own-engine.md) — собственный движок
  редактора; `@measured/puck` удалён.
- [ADR-0006](docs/adr/ADR-0006-chrome-ds-consumption.md) — ДС хрома: SoT
  `docs/design/`, синк в `src/editor/ds/`, каналы DesignSync и архив/intake.
- [ADR-0007](docs/adr/ADR-0007-template-contract.md) — эталон `editor-mvp` как
  машинный контракт «эталон = код ⊆ ДС».

## Стек

React + Vite + TypeScript (`type: module`), ESLint (flat config) + Prettier.
