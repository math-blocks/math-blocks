// End-to-end tests of the demo pages. They run against a production build of
// the demo, served by `vite preview`, so they also catch problems that only
// show up once the demo is bundled.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Glyph definitions rely on how browsers resolve <use> references, so
    // their tests also run in Firefox and in WebKit, the engine behind
    // Safari.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /glyph-defs\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /glyph-defs\.spec\.ts/,
    },
  ],
  webServer: {
    command: `yarn build && yarn vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
