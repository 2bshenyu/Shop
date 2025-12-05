// setup for vitest + testing-library
import { expect } from 'vitest'

let matchers = null

try {
  // Prefer CommonJS require to avoid ESM/CJS interop issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  matchers = require('@testing-library/jest-dom/dist/matchers')
} catch (e) {
  try {
    // try top-level package which may export matchers or default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jestDom = require('@testing-library/jest-dom')
    matchers = jestDom && (jestDom.matchers ?? jestDom.default ?? jestDom)
  } catch (e2) {
    // leave matchers null
  }
}

if (matchers && typeof matchers === 'object') {
  expect.extend(matchers)
} else {
  // warn so user sees helpful info in test logs
  // eslint-disable-next-line no-console
  console.warn('Warning: could not load @testing-library/jest-dom matchers; some jest-dom matchers may be unavailable in Vitest')
}

// Any other global test setup can go here
