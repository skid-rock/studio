// Конфиг e2e-смоука редактора (STUDIO-036).
// Dev-server поднимается сам (webServer); локально переиспользует уже запущенный.
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5577';

export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // list вместо html-репортёра: смоук — консольное ограждение, без веб-отчёта
    reporter: [['list']],
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        // predev прогонит tokens; strictPort — чтобы не уехать с baseURL
        command: 'npm run dev -- --port 5577 --strictPort',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
