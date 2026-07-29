import { test, expect } from '@playwright/test'
import { CREDENTIALS, hasCredentials } from '../helpers/env'
import { dismissCookieBanner, fillLoginForm, submitPrimaryForm } from '../helpers/auth'

test.describe('Web login', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/giris')
    await dismissCookieBanner(page)
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible()
    await expect(
      page.locator('input[name="password"], input[type="password"]').first(),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /şifremi unuttum/i })).toBeVisible()
  })

  test('rejects empty submit', async ({ page }) => {
    await page.goto('/giris')
    await dismissCookieBanner(page)
    await submitPrimaryForm(page)
    await expect(page.locator('text=/e-posta|şifre|gerekli|geçerli/i').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('member login succeeds when credentials provided', async ({ page }) => {
    test.skip(
      !hasCredentials(['E2E_MEMBER_EMAIL', 'E2E_MEMBER_PASSWORD']),
      'Set E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD',
    )
    await page.goto('/giris')
    await dismissCookieBanner(page)
    await fillLoginForm(page, CREDENTIALS.memberEmail()!, CREDENTIALS.memberPassword()!)
    await submitPrimaryForm(page)
    await expect(page).toHaveURL(/uygulama\.bachmain\.com|\/($|\?)/, { timeout: 45_000 })
  })
})
