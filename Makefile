# Makefile для studio (Vite + React + TS).
# Короткие команды-обёртки над npm-скриптами.

.DEFAULT_GOAL := help
.PHONY: help install dev build preview lint format tokens export verify e2e clean \
	spike spike-verify spike-craft spike-craft-verify

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

spike: ## Спайк редактора на Puck (браузер, STUDIO-008)
	npm run spike

spike-verify: ## Headless-проверка спайка на Puck (PASS/FAIL)
	npm run spike:verify

spike-craft: ## Спайк редактора на Craft.js (браузер, STUDIO-008)
	npm run spike:craft

spike-craft-verify: ## Headless-проверка спайка на Craft.js (PASS/FAIL)
	npm run spike:craft:verify

clean: ## Удалить node_modules и dist
	rm -rf node_modules dist
