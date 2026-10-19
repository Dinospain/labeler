import { defineConfig } from 'vitest/config'

// API-тесты ходят в реальный Postgres (DATABASE_URL), файлы запускаются последовательно
export default defineConfig({
  test: {
    include: ['test/**/*.api.test.ts'],
    globalSetup: ['test/globalSetup.ts'],
    environment: 'node',
    fileParallelism: false
  }
})
