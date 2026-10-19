import { test, expect } from '@playwright/test'
import { login, selectLabel, uniq } from './helpers'

test.beforeEach(async ({ page }) => {
  page.on('dialog', (d) => { throw new Error(`Неожиданный нативный диалог: ${d.message()}`) })
})

test('папка и этикетка: создание, правка, поиск, печать, удаление', async ({ page }) => {
  await login(page, 'hlebzavod')
  const folder = uniq('Папка')
  const name = uniq('Хлеб')

  // создать папку → становится активной
  await page.getByTestId('new-folder').click()
  await page.getByTestId('prompt-input').fill(folder)
  await page.getByTestId('prompt-submit').click()
  await expect(page.getByTestId('folder-panel')).toContainText(folder)

  // создать этикетку в активной папке
  await page.getByTestId('new-label').click()
  await page.getByTestId('f-productName').fill(name)
  await page.getByTestId('f-weight').fill('500 г')
  await page.getByTestId('f-manufacturedAt').fill('2025-03-01')
  await page.getByTestId('f-address').fill('г. Минск')
  await page.getByTestId('form-submit').click()
  await expect(page.getByTestId('label-list').getByText(name)).toBeVisible()

  // правка: даты сохраняются после перезагрузки, нетронутые поля не стёрты (B6)
  await selectLabel(page, name)
  await page.getByTestId('edit-label').click()
  await expect(page.getByTestId('f-manufacturedAt')).toHaveValue('2025-03-01')
  await page.getByTestId('f-expiresAt').fill('2025-03-05')
  await page.getByTestId('form-submit').click()
  await page.reload()
  await selectLabel(page, name)
  await page.getByTestId('edit-label').click()
  await expect(page.getByTestId('f-expiresAt')).toHaveValue('2025-03-05')
  await expect(page.getByTestId('f-manufacturedAt')).toHaveValue('2025-03-01')
  await expect(page.getByTestId('f-weight')).toHaveValue('500 г')
  await expect(page.getByTestId('f-address')).toHaveValue('г. Минск')
  await page.keyboard.press('Escape')

  // поиск
  await page.getByTestId('folder-all').click()
  await page.getByTestId('search').fill('Батон')
  await expect(page.getByTestId('label-list')).toContainText('Батон нарезной')
  await expect(page.getByTestId('label-list')).not.toContainText(name)
  await page.getByTestId('search').fill('')

  // печать: модалка запрашивает PDF
  await selectLabel(page, name)
  const pdf = page.waitForResponse((r) => r.url().includes('/api/print'))
  await page.getByTestId('print-label').click()
  const res = await pdf
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('application/pdf')
  await page.getByTestId('print-close').click()

  // удаление этикетки
  await selectLabel(page, name)
  await page.getByTestId('delete-label').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByTestId('label-list')).not.toContainText(name)
})

test('удаление папки возвращает этикетки в «Все»', async ({ page }) => {
  await login(page, 'restaurant')
  const folder = uniq('Врем')
  const name = uniq('Блюдо')

  await page.getByTestId('new-folder').click()
  await page.getByTestId('prompt-input').fill(folder)
  await page.getByTestId('prompt-submit').click()
  await page.getByTestId('new-label').click()
  await page.getByTestId('f-productName').fill(name)
  await page.getByTestId('form-submit').click()
  await expect(page.getByTestId('label-list')).toContainText(name)

  await page.getByTestId('delete-folder').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByTestId('folder-panel')).not.toContainText(folder)
  await page.getByTestId('folder-all').click()
  await expect(page.getByTestId('label-list')).toContainText(name)
})
