# tokens

Токены темы. Источник правды — JSON по стандарту W3C DTCG; CSS — производное.

## Структура

- `source/base/` — общие DTCG-токены (типографика, размеры, motion).
- `source/themes/<id>/` — палитра каждой темы (`color.json`).
- `dist/` — сгенерированные CSS-файлы тем (не править руками).
- `themes.ts` — реестр курированных тем (`id` + человекочитаемое имя).
- `build.mts` — программный билд Style Dictionary по каждой теме.
- `theme.ts` — загрузка CSS темы по `theme.id` из документа (Node, экспорт).

## Сборка

```bash
npm run tokens
# или
make tokens
```

Для каждой темы из `themes.ts`: `source/base/**` + `source/themes/<id>/**` → `dist/<id>.css`
с CSS-переменными (`--color-navy`, `--font-display`, …).

## Граница «тема vs инстанс»

В токены темы попадают только примитивы (палитра, типографика, отступы, радиусы,
длительности/easing). Параметры `--envelope-*` и `--slot-*` — per-instance props
модулей, не часть темы.

## Сид

Значения перенесены из `wed/src/styles/tokens.css` (строки 3–32).
