# Makefile для studio (Vite + React + TS).
# Короткие команды-обёртки над npm-скриптами.

.DEFAULT_GOAL := help
.PHONY: help install dev build preview lint format tokens clean

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

clean: ## Удалить node_modules и dist
	rm -rf node_modules dist
