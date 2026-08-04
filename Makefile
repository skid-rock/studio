# Makefile для studio (Vite + React + TS).
# Короткие команды-обёртки над npm-скриптами.

.DEFAULT_GOAL := help
.PHONY: help install dev build preview lint format tokens export verify e2e clean \
	ds-sync ds-check ds-intake \
	figma-inventory figma-export figma-lint figma-check

# Пресет линта «studio» для макетов Figma: состав правил задан явным списком,
# потому что секция lint.rules в .figma-use.json линтером игнорируется
# (проверено на figma-use v0.13.5). Обоснование состава — docs/figma-lint-preset.md.
FIGMA_LINT_RULES := \
	--rule no-hardcoded-colors --rule text-style-required --rule effect-style-required \
	--rule consistent-radius --rule touch-target-size --rule min-text-size \
	--rule no-default-names --rule no-hidden-layers --rule no-groups \
	--rule no-empty-frames --rule no-deeply-nested --rule no-mixed-styles \
	--rule no-detached-instances

help: ## Показать список доступных команд
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-12s %s\n", $$1, $$2}'

install: ## Установить зависимости
	npm install

dev: ## Запустить dev-сервер локально
	npm run dev

build: ## Проверить типы и собрать production-версию
	npm run build

preview: ## Предпросмотр собранной версии
	npm run preview

lint: ## Проверить код линтером (ESLint)
	npm run lint

format: ## Отформатировать код (Prettier)
	npm run format

tokens: ## Сгенерировать CSS-токены из DTCG JSON
	npm run tokens

export: ## Статический экспорт примера лендинга в dist-export/
	npm run tokens && npm run export

verify: ## Единый гейт сдачи: токены + ds:check + lint + build (tsc) + тесты
	npm run verify

ds-sync: ## Скопировать ДС docs/design → src/editor/ds
	npm run ds:sync

ds-check: ## Побайтовая сверка копии ДС с docs/design
	npm run ds:check

ds-intake: ## Приём обновления ДС: sync + check + verify + сводка
	npm run ds:intake

e2e: ## e2e-смоук редактора (Playwright)
	npm run test:e2e

figma-inventory: ## Инвентарь фрейма Figma одним вызовом (ARGS="32:127 --depth 2")
	npm run figma:inventory -- $(ARGS)

figma-export: ## Экспорт ассета из Figma в 2x (ARGS="238:2 public/img/dress-code/x.png")
	npm run figma:export -- $(ARGS)

figma-lint: ## Линт макета Figma пресетом studio (PAGE="Sections" или ARGS="--root 32:127")
	figma-use lint $(if $(PAGE),--page "$(PAGE)",) $(FIGMA_LINT_RULES) -v $(ARGS)

figma-check: ## Чекер секции: структура + стресс-тест ресайза (ARGS="--root 32:127")
	npm run figma:check -- $(ARGS)

clean: ## Удалить node_modules и dist
	rm -rf node_modules dist
