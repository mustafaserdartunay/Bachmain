/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    headless: true,
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
}
