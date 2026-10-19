import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('редактор шаблонов: маршрут /templates доступен из шапки', async ({ page }) => {
  await login(page, 'hlebzavod')
  await page.getByTestId('nav-templates').click()
  await expect(page).toHaveURL(/\/templates$/)
  await expect(page.getByTestId('template-editor')).toBeVisible()
  await expect(page.getByTestId('templates-empty')).toBeVisible()
})

test('шаблон аккаунта: правка и назначение текущим', async ({ page, request }) => {
  const created = await request.post('/api/templates', {
    headers: { 'X-Account': 'restaurant' },
    data: { name: 'e2e', html: '<html><body>old {{productName}}</body></html>', isCurrent: false },
  })
  expect(created.status()).toBe(201)

  await login(page, 'restaurant')
  await page.getByTestId('nav-templates').click()
  await page.getByTestId('template-select').selectOption({ label: 'e2e' })
  await page.getByTestId('template-html').fill('<html><body>new {{productName}}</body></html>')
  await page.getByTestId('template-save').click()
  await expect(page.getByTestId('template-message')).toHaveText('Шаблон сохранён')
  await page.getByTestId('template-make-current').click()
  await expect(page.getByTestId('template-message')).toHaveText('Шаблон назначен текущим')

  await page.reload()
  await expect(page.getByTestId('template-select')).toContainText('(текущий)')
  await expect(page.getByTestId('template-html')).toHaveValue(/new/)
})
