import { expect, type Page } from '@playwright/test'

export async function login(page: Page, slug: string) {
  await page.goto('/login')
  await page.getByPlaceholder(/hlebzavod/).fill(slug)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByTestId('label-list')).toBeVisible()
}

export function uniq(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`
}

// клик по этикетке — переключатель, поэтому выбираем, только если ещё не выбрана
export async function selectLabel(page: Page, name: string) {
  const btn = page.getByTestId('label-list').getByRole('button', { name })
  if ((await btn.getAttribute('aria-pressed')) !== 'true') await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
}
