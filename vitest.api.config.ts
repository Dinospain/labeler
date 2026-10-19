import { defineConfig } from 'vitest/config'

// API-тесты ходят в реальный Postgres (DATABASE_URL), файлы запускаются последовательно
export default defineConfig({
  test: {
    include: ['src/**/*.api.test.ts'],
    environment: 'node',
    fileParallelism: false
  }
})
