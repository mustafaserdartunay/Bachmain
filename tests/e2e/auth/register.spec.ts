import { test, expect } from '@playwright/test'
import { dismissCookieBanner } from '../helpers/auth'

test.describe('Web register', () => {
  test('register page renders required fields', async ({ page }) => {
    await page.goto('/register?plan=full&period=month')
    await dismissCookieBanner(page)
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible()
    await expect(
      page.locator('input[name="password"], input[type="password"]').first(),
    ).toBeVisible()
    await expect(
      page.locator('input[name="companyName"], input[name="fullName"]').first(),
    ).toBeVisible()
  })

  test('plan query is accepted', async ({ page }) => {
    await page.goto('/register?plan=starter')
    await dismissCookieBanner(page)
    await expect(page).toHaveURL(/register/)
    await expect(page.locator('form').first()).toBeVisible()
  })
})
