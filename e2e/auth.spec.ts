import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('без аккаунта редирект на /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})

test('вход через select и вручную', async ({ page }) => {
  await page.goto('/login')
  await page.locator('select').selectOption('restaurant')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByTestId('label-list')).toBeVisible()
  await login(page, 'hlebzavod')
  await expect(page.getByTestId('label-list')).toContainText('Батон нарезной')
})

test('неизвестный slug показывает ошибку', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/hlebzavod/).fill('nope')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByText('Account not found')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('изоляция: каждое предприятие видит только свои этикетки', async ({ page }) => {
  await login(page, 'hlebzavod')
  await expect(page.getByTestId('label-list')).toContainText('Батон нарезной')
  await expect(page.getByTestId('label-list')).not.toContainText('Тирамису')

  await page.goto('/login')
  await page.getByRole('button', { name: 'Сбросить' }).click()
  await login(page, 'restaurant')
  await expect(page.getByTestId('label-list')).toContainText('Тирамису')
  await expect(page.getByTestId('label-list')).not.toContainText('Батон нарезной')
})
