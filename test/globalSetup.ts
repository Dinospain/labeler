import { execSync } from 'child_process'

// Один раз: чистая схема из миграций в тестовой БД (DATABASE_URL должен указывать на одноразовый Postgres)
export default function setup() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for API tests')
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', { stdio: 'inherit' })
}
