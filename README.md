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
`preview`, `lint`, `format`, `verify`, `export`).

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
│  ├─ editor/           React-UI редактора
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

## Стек

React + Vite + TypeScript (`type: module`), ESLint (flat config) + Prettier.
