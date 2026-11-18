import { defineConfig, devices } from '@playwright/test';

// Behavior specs run against Storybook: the dev server locally, the static build in CI.
const isCI = !!process.env.CI;
// SKETCHBOOK_PORT lets parallel worktrees run their own Storybook.
const port = Number(process.env.SKETCHBOOK_PORT ?? 6006);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  // Screen-reader views are plain text from Chrome's accessibility tree: one file per view, no OS suffix.
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screen-reader__/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: isCI ? `npx http-server ../storybook-static -p ${port} -s` : 'npm run storybook -- --ci',
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
