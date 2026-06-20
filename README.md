# studio

Конструктор лендингов (личный/агентский инструмент). Редактор на React, выходной
render — лёгкий и агностичный к React. Маршрут развития —
[роадмап в gd-brain](../gd-brain/docs/studio/roadmap.md).

> Статус: Фаза 0 (фундамент) — пустой запускаемый каркас. Без редактора, DnD и
> хостинга.

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
`preview`, `lint`, `format`).

## Карта папок

```
studio/
├─ docs/adr/            ADR-решения (структура репо, основа редактора, схема…)
├─ src/
│  ├─ main.tsx          точка входа React-оболочки (заглушка Фазы 0)
│  ├─ App.tsx           минимальное приложение «studio»
│  ├─ render-core/      агностичный render + реестр блоков (Фаза 0, заглушка)
│  ├─ sections/         модули секций лендинга (наполняется на Фазе 1)
│  └─ tokens/           токены темы (DTCG → CSS)
├─ index.html
├─ vite.config.ts
└─ Makefile
```

Папка `editor/` (React-оболочка редактора) появится на Фазе 1 после выбора
основы редактора (STUDIO-008).

## Решения (ADR)

- [ADR-0001](docs/adr/ADR-0001-repo-structure.md) — структура репозитория: один
  пакет (не монорепо).

## Стек

React + Vite + TypeScript (`type: module`), ESLint (flat config) + Prettier.
