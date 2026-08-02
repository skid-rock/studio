## Learned User Preferences

- При установке или обновлении npm-зависимостей всегда брать самую свежую доступную версию пакета.
- Для реализации задач следовать рекомендованной модели из шапки `implementation-plan.md`; если модель выбрать нельзя — спросить.
- После завершения задачи обычно: перевести её в `done` в gd-brain (чеклист/`index.md`) и закоммитить затронутые репозитории (studio и/или gd-brain — «коммит везде»).
- Стиль кода: отступ 4 пробела; у `if`/`else` и подобных всегда фигурные скобки; IDE — JetBrains, форматирование через EditorConfig + Prettier/ESLint.
- Тесты писать только с явного разрешения на задачу; часто в том же запросе разрешают и просят прогнать lint/tests/build в конце.
- Неясный дефект сначала зафиксировать в `docs/improvements/bugs.md` (убедиться, что это баг, а не улучшение), затем править.
- Для Figma в Cursor: `user-figma-use` (локальный `figma-use` через `bun`, не `npx`); Framelink, официальный Figma MCP и `vkhanhqui/figma-mcp-go` — не использовать; GLips/Figma-Context-MCP на free-тарифе недоступен.
- Запрос «проверь секцию» + ссылка Figma (`node-id=…`) — **машинная проверка макета**, не перенос в код и не правки без явного «да». Порядок: см. Workspace Facts → «Проверка секции Figma».
- Запрос «покажи информацию» / «что в узле» + ссылка Figma — **инвентарь** (`make figma-inventory`), не check/lint и не перенос. См. Workspace Facts → «Инвентарь узла Figma».

## Learned Workspace Facts

- Dev-сервер и Playwright base URL студии — порт `5577` (не дефолтный Vite 5173).
- Задачи и планы реализации studio живут в `../gd-brain/tasks/studio/` (`STUDIO-NNN`); статусы обновляются там, не в репозитории studio.
- HTML-мокапы в `docs/design/editor/` — историческая спека/песочница; актуальный UI — живой редактор; принципы — `docs/design/design-system.md`.
- Запись багов/техдолга: `docs/improvements/bugs.md` и `docs/improvements/backlog.md` (IMP-xxx).
- Локальный клон `figma-use` для bun-link: `/Users/alexey/devp/figma-use` (master с GitHub).
- Общее для Figma CLI: из URL `node-id` (`38-2` → `38:2`); Figma desktop с `--remote-debugging-port=9222`; `figma-use status` → Connected. Цели Makefile — `README.md` § «Перенос секции из Figma».
- **Инвентарь узла Figma** (когда просят «покажи информацию» / «что в» + ссылку):
  1. `make figma-inventory ARGS="<id> --depth 2"` (корень + дети; `--depth 1` — только прямой уровень; без `--depth` — полное дерево).
  2. Ответ — **компактное дерево** (не JSON), образец:
     ```
     Section/Schedule  393×507  HUG  solid→photo(CROP)  pad 46/34  gap 10
     ├─ ПРОГРАММА ДНЯ  Arina 36 / white var
     └─ shell          325×365  FILL×HUG  board FIT  pad 54  minHeight 365
        ├─ deco/pearl  ABSOLUTE 32×32  (единственный absolute — ок)
        └─ board       4 пункта, gap 16, Open Sans Condensed Light 18
     ```
     Корень: имя · WxH · вертикальный sizing (HUG/FIXED) · fill · pad · gap · align если не MIN.
     Текст: содержимое или имя · шрифт кегль · цвет (`var` / `no-var`).
     Фрейм: имя · WxH · H×V sizing · fill/stroke · pad · заметные флаги (ABSOLUTE, minHeight, clips).
     Однородные списки — сводкой («4 пункта»), не поэлементно; `deco/*` и аномалии — явно.
     Полный JSON — только если попросили «сырой»/`--out`.
  3. Не гонять check/lint и не править макет, пока не попросят отдельно.
- **Проверка секции Figma** (когда просят «проверь секцию» / ссылку с `node-id`):
  1. Гейт структуры + стресс сужения до 320: `make figma-check ARGS="--root <id>"` (вердикт `pass`/`fail`; fail только по error).
  2. Гигиена токенов/типографики (не гейт переноса): `make figma-lint ARGS="--root <id>"`.
  3. При необходимости имя/дети: `make figma-inventory ARGS="<id> --depth 1"`.
  4. В ответе: имя узла, вердикт check, кратко lint; макет/код не трогать, пока не попросят. Рецепт переноса — `gd-brain/docs/knowledge/tools/figma/figma-to-studio-recipe.md`.
