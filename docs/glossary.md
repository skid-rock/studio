# Глоссарий studio (единый язык)

Короткие определения ключевых терминов + где это в коде. Цель — чтобы человек и ИИ
понимали слово одинаково. Карта слоёв и поток данных — в
[architecture.md](architecture.md) (этот словарь её дополняет, не дублирует);
«почему так» — в [docs/adr/](adr/).

Ссылки на код даны относительно `docs/` (т.е. `../src/...`).

## Документ-модель

### **StudioDocument**

Корневой объект лендинга и **единственный источник правды**: `schemaVersion`,
`theme`, `motion`, `sections[]`. Редактор лишь маппит его в/из Puck; все правки
идут в документ.
[document.ts](../src/render-core/document.ts)

### **SectionNode**

Узел секции: `id` (стабильный nanoid), `type` (ключ в реестре блоков, напр.
`intro/envelope`), `order` (дробный индекс), `props` (параметры секции),
опциональные `children`. Модель плоская: операции и render по `children` пока не
реализованы.
[document.ts](../src/render-core/document.ts)

### **schemaVersion**

Поле документа — версия формы модели (`CURRENT_SCHEMA_VERSION = 1`). Растёт при
несовместимых изменениях; `parseDocument` отвергает чужие версии. Не путать с
`ParamSchema` блока.
[document.ts](../src/render-core/document.ts) ·
[document.schema.ts](../src/render-core/document.schema.ts)

### **motion / MotionConfig**

Поле документа: пресет движения (`{ preset: string }`, напр. `subtle` /
`expressive`). Детализируется в Фазе 3; пока хранится как ссылка на пресет.
[document.ts](../src/render-core/document.ts)

### **theme / ThemeRef**

Поле документа: ссылка на тему по `id` (id курированного набора токенов, напр.
`cream-navy`) + опциональные точечные `overrides` CSS-переменных. CSS темы
резолвится из токенов при сборке страницы.
[document.ts](../src/render-core/document.ts) ·
[theme.ts](../src/tokens/theme.ts)

### **дробный order (fractional index) / orderBetween**

Порядок секций задаётся строковым **дробным индексом** (fractional-indexing): между
любыми двумя ключами всегда есть промежуточный. Вставка/перемещение пересчитывают
order **только** у одной секции (`orderBetween(prev, next)`), не сдвигая остальные.
[order.ts](../src/render-core/order.ts) ·
[document.ts](../src/render-core/document.ts) (`addSection`/`moveSection`/`sortedSections`)

### **parseDocument (zod-валидация)**

Проверяет **форму** сырого документа zod-схемой и сужает к `StudioDocument`;
бросает при несоответствии формы или версии. Это валидация уровня документа —
семантику props блока проверяет `ParamSchema` (разные слои).
[document.schema.ts](../src/render-core/document.schema.ts)

## Рендер

### **render-core**

Агностичное ядро (ванильный TS): модель документа, схема параметров, реестр,
render, сборка страницы. **Не импортирует** React/Puck — граница проверяется линтом
([ADR-0001](adr/ADR-0001-repo-structure.md), STUDIO-027).
[src/render-core/](../src/render-core/) · [README](../src/render-core/README.md)

### **BlockModule**

Модуль блока в реестре: `{ type, label, schema, defaults, render, css? }`. Контракт
«тип секции → схема + дефолты + render + CSS».
[types.ts](../src/render-core/types.ts)

### **RenderFn / RenderContext**

`RenderFn = (props, ctx) => string` — **чистая** функция props → строка HTML,
без обращения к `document`/`window`/DOM (работает и в Node). `RenderContext = { doc }`
([ADR-0002](adr/ADR-0002-render-contract.md)).
[types.ts](../src/render-core/types.ts)

### **renderDocument / RenderResult**

`renderDocument(doc, { registry })` обходит секции в порядке `order`, для каждого
типа зовёт `mod.render(props, ctx)`, собирает `RenderResult { html, css }` (CSS
дедуплицируется по типу). Неизвестный тип **не роняет** render — вставляет
HTML-комментарий-заглушку.
[render.ts](../src/render-core/render.ts) · [types.ts](../src/render-core/types.ts)

### **buildPage**

Собирает полный HTML-документ из `RenderResult` и CSS темы: `<!DOCTYPE>` +
`<style>` (base/тема/блоки) + `<body>`. Слой сборки страницы поверх `renderDocument`.
[page.ts](../src/render-core/page.ts)

### **registry / defineBlock**

`registry` (`createRegistry`, тип `BlockRegistry`) — гетерогенная Map `type →
BlockModule`. `defineBlock(mod)` — единственная точка **стирания типа `P`**: узкий
`BlockModule<P>` → стёртый `BlockModule`, чей render рантайм-сужает props через
`parseBySchema` (вариант D, IMP-001).
[registry.ts](../src/render-core/registry.ts)

### **defaultRegistry**

Реестр секций по умолчанию для демо/экспорта: `envelope`, `hero`, `closing` через
`defineBlock`. Wiring живёт в `sections/`, не в ядре.
[registry.default.ts](../src/sections/registry.default.ts)

### **ParamSchema**

Схема параметров блока: массив групп `{ group, items }`; элемент `Param` —
`range` | `color` | `text` | `select` с `key`, `label`, `def` и
типоспецифичными полями. Источник дефолтов и автопанели редактора
([ADR-0003](adr/ADR-0003-schema-format.md)). Не путать с `schemaVersion` документа.
[schema.ts](../src/render-core/schema.ts)

### **defaultsFromSchema / parseBySchema**

`defaultsFromSchema(schema)` собирает дефолтные props из `def` каждого параметра.
`parseBySchema(schema, raw)` — рантайм-граница `unknown → P`: для каждого ключа
схемы берёт значение из raw, если оно валидно по типу параметра, иначе `def`;
ключи вне схемы отбрасывает. Возвращает полный объект props.
[schema.ts](../src/render-core/schema.ts)

### **preset**

`preset.json` модуля — «боевые» значения props, перекрывающие дефолты из схемы:
`ENVELOPE_DEFAULTS = { ...defaultsFromSchema(schema), ...preset }`. Недостающие в
пресете ключи берутся из схемы.
[intro-envelope/preset.json](../src/sections/intro-envelope/preset.json) ·
[intro-envelope/schema.ts](../src/sections/intro-envelope/schema.ts)

### **intro/envelope (модуль секции)**

Первый модуль реестра — конверт-заставка (перенос из `wed`). Render агностичен,
геометрия/анимация считаются в чистых функциях. Пример полного `BlockModule`
(schema → defaults → render → css).
[src/sections/intro-envelope/](../src/sections/intro-envelope/)

## Темы / токены

### **токены (W3C DTCG)**

Примитивы темы (палитра, типографика, размеры, motion) в JSON по стандарту **W3C
DTCG** (`src/tokens/source/`). CSS — производное (Style Dictionary → `dist/*.css` с
CSS-переменными). Источник правды — JSON, CSS руками не правят.
[tokens/README](../src/tokens/README.md) · [tokens/source/](../src/tokens/source/)

### **loadThemeCss / resolveThemeCss**

Загрузка CSS темы по `theme.id` из `dist/` и применение точечных `overrides`
документа (`:root { --var: value }`). CSS темы инжектится в `buildPage`.
[theme.ts](../src/tokens/theme.ts)

### **граница «тема vs инстанс»**

В токены темы идут только **примитивы**. Параметры конкретного блока (`--envelope-*`,
`--slot-*`) — per-instance props модуля, **не** часть темы.
[tokens/README](../src/tokens/README.md)

## Редактор

### **editor (driving-адаптер)**

React-оболочка на Puck: тонкий маппинг модели ↔ Puck, автопанель из схемы, превью.
Единственное место, где живут React/Puck. Замена движка = переписать `src/editor/`,
не трогая ядро ([ADR-0004](adr/ADR-0004-editor-base.md)).
[src/editor/](../src/editor/)

### **BlockPreview**

React-обёртка превью: зовёт тот же `mod.render(props, ctx)` и вставляет результат
через `dangerouslySetInnerHTML`. Второго пути разметки нет — превью и экспорт идут
одним render (анти-drift).
[block-preview.tsx](../src/editor/block-preview.tsx)

### **documentToPuck / puckToDocument**

Маппинг состояния редактора (`Puck.Data`) в/из `StudioDocument` без потерь
(round-trip). Порядок секций — дробный `order`, пересчитывается по минимуму.
[puck-adapter.ts](../src/editor/puck-adapter.ts)

### **fieldsFromSchema (автопанель)**

Строит поля панели свойств Puck из `ParamSchema` модуля (range→number,
text→textarea, select→select, color→custom). Перевод схемы в контролы изолирован в
одном модуле.
[fields-from-schema.ts](../src/editor/fields-from-schema.ts)

## Процесс / контроль

### **drift / anti-drift**

**Drift** — расхождение между превью редактора и прод-выводом, классическая болезнь
WYSIWYG-билдеров (второй путь рендера). **Anti-drift** — один путь рендера:
`renderDocument` (`mod.render`) рисует и превью, и экспорт; второго рендерера нет
([ADR-0002](adr/ADR-0002-render-contract.md)).

### **full-bleed**

Секция во весь экран, вне обычного потока (конверт — `position: fixed`). В холсте
редактора её `fixed` нейтрализуется (`data-block` + класс в `BlockPreview`);
честный «режим холста» — задача Фазы 1.
[intro-envelope/styles.ts](../src/sections/intro-envelope/styles.ts) ·
[block-preview.tsx](../src/editor/block-preview.tsx) ·
[ADR-0004](adr/ADR-0004-editor-base.md)

### **гранулярность inline (data-prop + contenteditable)**

Уровень адресуемой единицы inline-правки текста. Решение — **путь (б), якоря**:
render помечает редактируемые места атрибутами `data-prop="..." contenteditable`,
редактор слушает `input` и пишет в нужный prop; строковый render и плоская модель
сохраняются. **Статус:** решение зафиксировано в ADR-0002, в разметке секций ещё не
внедрено (реализация — M4 / STUDIO-014).
[ADR-0002 (дополнение)](adr/ADR-0002-render-contract.md)

### **гексагон / порты-адаптеры**

Парадигма проекта: ядро (`render-core`/`sections`) — домен без фреймворка; `editor`
— driving-адаптер; Puck — сменная реализация за адаптером. Все зависимости
направлены внутрь, к ядру.
[architecture.md](architecture.md) §1–3

### **правило границ (машинная проверка)**

Главный инвариант: `render-core/` и `sections/` не импортируют React, `react-dom`,
`@measured/puck`, `../editor`. Проверяется линтом (`no-restricted-imports`,
STUDIO-027) — нарушение валит `make lint`.
[architecture.md](architecture.md) §3 · [CLAUDE.md](../CLAUDE.md)

### **ADR**

Architecture Decision Record — запись принятого решения с обоснованием («почему
так»). Карта (`architecture.md`) сводит решения, ADR хранят причины.
[docs/adr/](adr/)
