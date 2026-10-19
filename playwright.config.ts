import { defineConfig } from '@playwright/test'

// E2E: собранный клиент раздаётся самим API (PORT=8081) на одноразовой БД (DATABASE_URL; БД сбрасывается!)
const PORT = 8081
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || (process.env.CI ? undefined : '/opt/pw-browsers/chromium')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command:
      'npx prisma migrate reset --force --skip-seed --skip-generate && npm run seed && npm run build && npm --prefix client run build && npm start',
    url: `http://localhost:${PORT}/api/auth/accounts`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
