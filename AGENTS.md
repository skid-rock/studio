## Learned User Preferences

- При установке или обновлении npm-зависимостей всегда брать самую свежую доступную версию пакета.
- Для реализации задач следовать рекомендованной модели из шапки `implementation-plan.md`; если модель выбрать нельзя — спросить.
- После завершения задачи обычно: перевести её в `done` в gd-brain (чеклист/`index.md`) и закоммитить затронутые репозитории (studio и/или gd-brain — «коммит везде»).
- Стиль кода: отступ 4 пробела; у `if`/`else` и подобных всегда фигурные скобки; IDE — JetBrains, форматирование через EditorConfig + Prettier/ESLint.
- Тесты писать только с явного разрешения на задачу; часто в том же запросе разрешают и просят прогнать lint/tests/build в конце.
- Неясный дефект сначала зафиксировать в `docs/improvements/bugs.md` (убедиться, что это баг, а не улучшение), затем править.
- Для Figma в Cursor: `user-figma-use` (локальный `figma-use` через `bun`, не `npx`); Framelink, официальный Figma MCP и `vkhanhqui/figma-mcp-go` — не использовать; GLips/Figma-Context-MCP на free-тарифе недоступен.

## Learned Workspace Facts

- Dev-сервер и Playwright base URL студии — порт `5577` (не дефолтный Vite 5173).
- Задачи и планы реализации studio живут в `../gd-brain/tasks/studio/` (`STUDIO-NNN`); статусы обновляются там, не в репозитории studio.
- HTML-мокапы в `docs/design/editor/` — историческая спека/песочница; актуальный UI — живой редактор; принципы — `docs/design/design-system.md`.
- Запись багов/техдолга: `docs/improvements/bugs.md` и `docs/improvements/backlog.md` (IMP-xxx).
- Локальный клон `figma-use` для bun-link: `/Users/alexey/devp/figma-use` (master с GitHub).
