import { test, expect } from '@playwright/test'
import { CREDENTIALS, hasCredentials } from '../helpers/env'
import { fillLoginForm, submitPrimaryForm } from '../helpers/auth'

const ROUTES = [
  { name: 'teklif', path: '/teklifler' },
  { name: 'siparis', path: '/siparisler' },
  { name: 'uretim', path: '/uretim' },
  { name: 'depo', path: '/depo' },
  { name: 'raporlar', path: '/analitik' },
] as const

async function ensureCrmSession(page: import('@playwright/test').Page) {
  const web = process.env.WEB_URL || 'https://bachmain.com'
  await page.goto(`${web}/giris`)
  await fillLoginForm(page, CREDENTIALS.memberEmail()!, CREDENTIALS.memberPassword()!)
  await submitPrimaryForm(page)
  await page.waitForURL(/uygulama\.bachmain\.com/, { timeout: 45_000 })
}

test.describe('CRM process modules', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasCredentials(['E2E_MEMBER_EMAIL', 'E2E_MEMBER_PASSWORD']),
      'Set E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD',
    )
    await ensureCrmSession(page)
  })

  for (const route of ROUTES) {
    test(`${route.name} page opens`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/')))
      await expect(page.locator('main, [role="main"], h1, h2').first()).toBeVisible()
    })
  }
})
