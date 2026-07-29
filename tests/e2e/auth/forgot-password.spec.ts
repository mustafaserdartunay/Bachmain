import { test, expect } from '@playwright/test'
import { dismissCookieBanner, submitPrimaryForm } from '../helpers/auth'

test.describe('Forgot password', () => {
  test('page matches login panel layout', async ({ page }) => {
    await page.goto('/sifremi-unuttum')
    await dismissCookieBanner(page)
    await expect(page.getByText(/şifremi unuttum/i).first()).toBeVisible()
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible()
    await expect(page.locator('img[src*="bachy"]').first()).toHaveCount(0)
  })

  test('validates empty email', async ({ page }) => {
    await page.goto('/sifremi-unuttum')
    await dismissCookieBanner(page)
    await submitPrimaryForm(page)
    await expect(page.locator('text=/e-posta|gerekli|geçerli/i').first()).toBeVisible()
  })
})
