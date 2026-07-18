/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite. React-плагин нужен только для оболочки редактора.
// Выходной render остаётся агностичным к React (ванильный TS из render-core).
// Один вход: свой редактор (STUDIO-035).
export default defineConfig({
    plugins: [react()],
    server: {
        // Не дефолт Vite (5173): уйти с занятого/привычного порта
        port: 5577,
        strictPort: true,
    },
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
});
