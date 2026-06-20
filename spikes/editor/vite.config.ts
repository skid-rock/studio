/**
 * Отдельный Vite-конфиг спайка (STUDIO-008). Запуск:
 *   npx vite --config spikes/editor/vite.config.ts
 * (или `npm run spike`). Прод-сборку проекта не трогает.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "../..");

export default defineConfig({
  root: here,
  // Переиспользуем реальный public проекта — чтобы грузились img/seal.png и шрифты.
  publicDir: resolve(projectRoot, "public"),
  plugins: [react()],
  server: {
    // Спайк импортирует из ../../src и ../../public — разрешаем доступ к корню.
    fs: { allow: [projectRoot] },
  },
});
