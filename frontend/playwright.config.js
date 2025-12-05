// Playwright config for Shop-MVP frontend e2e tests
/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ],
  testDir: './tests'
};

