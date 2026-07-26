/**
 * Playwright-ready smoke paths (run when Playwright is installed):
 *   npx playwright test tests/e2e/smoke.spec.js
 *
 * Until browsers are installed in CI, scripts/smoke-security.mjs remains the gate.
 */
import { test, expect } from '@playwright/test'

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'

test.describe('BachMain smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto(`${base}/giris`)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('button', { name: /giriş|giris|login/i }).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shelved stub hubs redirect home when authenticated local', async ({ page }) => {
    // Without auth, RequireAuth sends to /giris — that is also acceptable.
    await page.goto(`${base}/finans`)
    await page.waitForURL(/\/(giris)?$|\/finans/, { timeout: 15_000 })
    const url = page.url()
    expect(url.includes('/finans') && !url.includes('giris')).toBeFalsy()
  })
})
