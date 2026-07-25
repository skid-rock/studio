# Makefile для studio (Vite + React + TS).
# Короткие команды-обёртки над npm-скриптами.

.DEFAULT_GOAL := help
.PHONY: help install dev build preview lint format tokens export verify e2e clean \
	figma-inventory figma-export

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

verify: ## Единый гейт сдачи: токены + lint + build (tsc) + тесты
	npm run verify

e2e: ## e2e-смоук редактора (Playwright)
	npm run test:e2e

figma-inventory: ## Инвентарь фрейма Figma одним вызовом (ARGS="32:127 --depth 2")
	npm run figma:inventory -- $(ARGS)

figma-export: ## Экспорт ассета из Figma в 2x (ARGS="238:2 public/img/dress-code/x.png")
	npm run figma:export -- $(ARGS)

clean: ## Удалить node_modules и dist
	rm -rf node_modules dist
