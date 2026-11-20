import { defineConfig, devices } from '@playwright/test';

// Run `npm run docs:build` before these tests; the docs server serves site-dist.
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:4173', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run docs:serve',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
