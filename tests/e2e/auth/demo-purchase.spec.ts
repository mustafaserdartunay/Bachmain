import { test, expect } from '@playwright/test'
import { dismissCookieBanner } from '../helpers/auth'

test.describe('Demo and package purchase entry', () => {
  test('demo page loads', async ({ page }) => {
    await page.goto('/demo')
    await dismissCookieBanner(page)
    await expect(
      page.locator('form, input[name="email"], input[type="email"]').first(),
    ).toBeVisible()
  })

  test('pricing page loads packages', async ({ page }) => {
    await page.goto('/fiyatlar')
    await dismissCookieBanner(page)
    await expect(page.getByText(/paket|starter|enterprise|pro|fiyat/i).first()).toBeVisible()
  })

  test('purchase entry via register plan query', async ({ page }) => {
    await page.goto('/register?plan=full')
    await dismissCookieBanner(page)
    await expect(page).toHaveURL(/plan=full/)
    await expect(page.locator('form').first()).toBeVisible()
  })
})
