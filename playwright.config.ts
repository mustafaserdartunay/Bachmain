import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const WEB_URL = process.env.WEB_URL || 'https://bachmain.com'
const APP_URL = process.env.APP_URL || 'https://uygulama.bachmain.com'
const ADMIN_URL = process.env.ADMIN_URL || 'https://yonetim.bachmain.com'
const REPORT_DIR = path.join('tests', 'reports', 'playwright')

export default defineConfig({
  testDir: './tests/e2e',
  // Production landing pages carry animation/media; one browser worker avoids WebKit/Chromium
  // teardown instability and makes failure traces deterministic.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(REPORT_DIR, 'html'), open: 'never' }],
    ['json', { outputFile: path.join(REPORT_DIR, 'results.json') }],
    ['junit', { outputFile: path.join(REPORT_DIR, 'junit.xml') }],
  ],
  outputDir: path.join(REPORT_DIR, 'artifacts'),
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'web-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_URL },
      testMatch: /auth\/.*\.spec\.ts/,
    },
    {
      name: 'app-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: APP_URL },
      testMatch: /crm\/.*\.spec\.ts/,
    },
    {
      name: 'admin-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL },
      testMatch: /admin\/.*\.spec\.ts/,
    },
  ],
})
