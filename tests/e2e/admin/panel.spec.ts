import { test, expect } from '@playwright/test'
import { CREDENTIALS, hasCredentials } from '../helpers/env'
import { fillLoginForm, submitPrimaryForm } from '../helpers/auth'

test.describe('Admin panel', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/giris')
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible()
    await expect(
      page.locator('input[name="password"], input[type="password"]').first(),
    ).toBeVisible()
  })

  test('staff login and members list', async ({ page }) => {
    test.skip(
      !hasCredentials(['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD']),
      'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD',
    )
    await page.goto('/giris')
    await fillLoginForm(page, CREDENTIALS.adminEmail()!, CREDENTIALS.adminPassword()!)
    await submitPrimaryForm(page)
    await expect(page).not.toHaveURL(/\/giris$/, { timeout: 45_000 })
    await page.goto('/uyeler')
    await expect(page.getByText(/üye|member|e-posta/i).first()).toBeVisible()
  })
})
