import { test, expect } from '@playwright/test'
import { CREDENTIALS, hasCredentials } from '../helpers/env'
import { fillLoginForm, submitPrimaryForm } from '../helpers/auth'

async function softLoginViaWeb(page: import('@playwright/test').Page) {
  const web = process.env.WEB_URL || 'https://bachmain.com'
  await page.goto(`${web}/giris`)
  await fillLoginForm(page, CREDENTIALS.memberEmail()!, CREDENTIALS.memberPassword()!)
  await submitPrimaryForm(page)
  await page.waitForURL(/uygulama\.bachmain\.com/, { timeout: 45_000 })
}

test.describe('CRM shell', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasCredentials(['E2E_MEMBER_EMAIL', 'E2E_MEMBER_PASSWORD']),
      'Set E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD',
    )
    await softLoginViaWeb(page)
  })

  test('dashboard loads after login', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('nav, aside, [data-sidebar], a[href="/"]').first()).toBeVisible()
  })
})
