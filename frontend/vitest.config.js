import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // only include our source tests, exclude node_modules and Playwright E2E tests
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['**/tests/**', 'tests/**', 'node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: 'src/setupTests.js'
  }
})
