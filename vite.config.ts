/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite. React-плагин нужен только для оболочки редактора (Фаза 1+).
// Выходной render остаётся агностичным к React (ванильный TS из render-core).
export default defineConfig({
    plugins: [react()],
    build: {
        // Два входа: дефолтный Puck-редактор и свой редактор (STUDIO-032).
        rollupOptions: {
            input: {
                index: fileURLToPath(new URL('./index.html', import.meta.url)),
                editor: fileURLToPath(new URL('./editor.html', import.meta.url)),
            },
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
