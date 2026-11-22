import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

// Only reuse the demo's module resolution (the @math-blocks/* alias that points
// each package at its src/index.ts). Its plugins and build settings are for the
// demo and don't apply to the unit tests.
export default defineConfig({
  resolve: viteConfig.resolve,
  test: {
    globals: true,
    // Tests that need a DOM opt in with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['{packages,demo}/**/__tests__/*.test.{ts,tsx}'],
    // Playwright runs the end-to-end tests in e2e/; see playwright.config.ts.
    exclude: ['**/node_modules/**', '**/out/**', '**/dist/**', 'e2e/**'],
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      // Codecov picks up coverage/lcov.info in CI.
      reporter: ['text', 'lcov', 'clover', 'json'],
      include: ['packages/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/out/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/stories/**',
        '**/*.d.ts',
        '**/test-util.ts',
        // Test-only helpers for parsing and printing plain-text math.
        'packages/tutor/src/testing/**',
      ],
    },
  },
});
