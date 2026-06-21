# Технический бэклог (будущие улучшения)

Журнал известных, осознанно отложенных улучшений — «чтобы не забыть». В отличие
от [ADR](../adr/) (зафиксированные принятые решения) здесь лежат места, которые
сейчас работают приемлемо, но которые стоит подтянуть в будущей фазе. Каждый
пункт: где, симптом, корень, варианты, рекомендация и условие-триггер.

---

## IMP-001. Реестр блоков: `any` как супертип гетерогенных модулей

- **Статус:** решено в STUDIO-013 (вариант D — рантайм-парсер на модуль).
- **Где:** [`src/render-core/registry.ts`](../../src/render-core/registry.ts) —
  `type AnyBlockModule = BlockModule<any>` (с `eslint-disable no-explicit-any`).
- **Появилось в:** STUDIO-006 (первый типизированный модуль `intro/envelope`).

### Симптом

Реестр хранит модули с разными типами props (`BlockModule<EnvelopeState>`, далее
`BlockModule<HeroState>` и т.д.) в одной `Map`. Чтобы узкий модуль принимался в
`register`/`createRegistry`, параметр расширен до `BlockModule<any>`.

### Корень

Узкий `BlockModule<P>` **не присваивается** дефолтному
`BlockModule<Record<string, unknown>>`. Проверено пробой `tsc`:

```
error TS2322: 'BlockModule<EnvelopeState>' is not assignable to 'BlockModule<Record<string, unknown>>'.
error TS2322: 'RFn<EnvelopeState>'        is not assignable to 'RFn<Record<string, unknown>>'.
// defaults: Record<string, unknown> = module.defaults  →  ошибки НЕТ
```

Единственный блокер — **контравариантность `render`** (`(props: P) => string` в
позиции входа при `strictFunctionTypes`). `defaults: P` (ковариантная позиция)
присваивается без проблем. → Комментарий в `registry.ts`, упоминающий
«ковариантность defaults» как причину, **неточен** — поправить заодно.

Глубже вариантности: реестр моделирует **экзистенциальный тип** `∃P. BlockModule<P>`
(коллекция модулей, у каждого свой `P`, где `defaults` и `render` обязаны делить
один и тот же `P`). First-class экзистенциалов в TypeScript нет, а `P` стоит сразу
в ко- и контравариантной позиции — ни один конкретный супертип не подходит без
стирания. Плюс документ хранит `props` как нетипизированный
`Record<string, unknown>` (это JSON) — граница `unknown → P` неизбежна и её всё
равно надо чем-то перекрыть. `any` — самый дешёвый мост.

Блокор-радиус текущего `any` мал: он живёт только в параметрах
`register`/`createRegistry`; хранилище — `Map<string, BlockModule>`, поэтому
`get`/`list` уже отдают чистый `BlockModule`.

### Варианты

- **B (рекомендуется, если убирать `any`). Smart-constructor / хелпер стирания.**
  Реестр типизируем обычным `BlockModule`, без `any` и без `eslint-disable`.
  Стирание `P` — в одной задокументированной точке:

    ```ts
    // Узкий BlockModule<P> → стёртый BlockModule. Единственное явное и grep-able
    // место «нечестности», оправданное валидацией props по schema модуля.
    export function defineBlock<P extends Record<string, unknown>>(
        m: BlockModule<P>,
    ): BlockModule {
        return m as unknown as BlockModule;
    }
    // createRegistry([defineBlock(envelopeModule)])
    ```

    Авторская типизация модуля остаётся полной (`BlockModule<EnvelopeState>`
    проверяется как раньше), неявный `any` из render-core исчезает.

- **C (не рекомендуется). Бивариантность через метод.** Объявить `render`
  методом интерфейса (`render(props: P, ctx): string` вместо стрелочного поля) —
  методы биварианты, узкий тип станет присваиваемым без `any`. Но это та же
  unsound-дыра, только **спрятанная** и работающая всегда, а не в одной точке.
  Хуже явного каста.

- **D (правильный ответ на перспективу). Рантайм-парсер на модуль.** Добавить
  модулю `parse(raw: unknown): P` и хранить в реестре стёртый модуль, чей render
  замыкается на типизированный: `storedRender = (raw) => typedRender(parse(raw))`.
  Каста нет нигде — сужение `unknown → P` обеспечено реальной рантайм-проверкой
  (честная реализация экзистенциала через замыкание). Парсер можно строить из
  уже существующей `schema` (`parseBySchema(schema, raw): P` в пару к
  `defaultsFromSchema`), чтобы не плодить бойлерплейт.

### Рекомендация и триггер

Для Фазы 0 `any` приемлем и хорошо локализован. Если подтягивать с минимумом
изменений — вариант **B**. Вариант **D** логично сделать тогда, когда появится
**валидация props** (фаза редактора): там сужение `unknown → P` получит настоящую
рантайм-гарантию, и стирание станет полностью sound. Заодно поправить неточный
комментарий про «ковариантность defaults» в `registry.ts`.

**Решено (STUDIO-013).** Реализован вариант **D**: `parseBySchema(schema, raw)`
(`src/render-core/schema.ts`) + `defineBlock` (`src/render-core/registry.ts`) хранит в
реестре стёртый модуль с замыканием `render = (raw) => typedRender(parseBySchema(...))`.
`BlockModule<any>`/`eslint-disable` из `registry.ts` убраны; стирание стало sound
(сужение `unknown → P` обеспечено рантайм-проверкой). Тот же парсер применяется при
записи props из редактора (`puckToDocument`). Неточный комментарий про
«ковариантность defaults» в `registry.ts` исправлен (единственный блокер —
контравариантность `render`).

### Ссылки

- [ADR-0002](../adr/ADR-0002-render-contract.md) — контракт render и реестра.
- [ADR-0003](../adr/ADR-0003-schema-format.md) — `ParamSchema`, `defaultsFromSchema`
  (база для `parseBySchema` из варианта D).
