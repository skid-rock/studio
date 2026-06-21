/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite. React-плагин нужен только для оболочки редактора (Фаза 1+).
// Выходной render остаётся агностичным к React (ванильный TS из render-core).
export default defineConfig({
    plugins: [react()],
    test: {
        include: ['src/**/*.test.ts'],
    },
});
