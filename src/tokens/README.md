# tokens

Токены темы. Источник правды — JSON по стандарту W3C DTCG; CSS — производное.

## Структура

- `source/` — DTCG JSON (палитра, типографика, размеры, motion).
- `dist/` — сгенерированные CSS-файлы тем (не править руками).
- `config.json` — конфиг Style Dictionary.
- `theme.ts` — загрузка CSS темы по `theme.id` из документа.

## Сборка

```bash
npm run tokens
# или
make tokens
```

Результат: `dist/cream-navy.css` с CSS-переменными (`--color-navy`, `--font-display`, …).

## Граница «тема vs инстанс»

В токены темы попадают только примитивы (палитра, типографика, отступы, радиусы,
длительности/easing). Параметры `--envelope-*` и `--slot-*` — per-instance props
модулей, не часть темы.

## Сид

Значения перенесены из `wed/src/styles/tokens.css` (строки 3–32).
