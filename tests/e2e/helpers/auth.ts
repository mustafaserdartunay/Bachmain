import type { Page } from '@playwright/test'

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.locator('input[name="email"], input[type="email"]').first().fill(email)
  await page.locator('input[name="password"], input[type="password"]').first().fill(password)
}

export async function submitPrimaryForm(page: Page) {
  await page.locator('form button[type="submit"], button[type="submit"]').first().click()
}

export async function dismissCookieBanner(page: Page) {
  const requiredOnly = page.getByRole('button', { name: /yalnızca zorunlu/i })
  if (await requiredOnly.isVisible({ timeout: 2000 }).catch(() => false)) {
    await requiredOnly.click()
  }
}
