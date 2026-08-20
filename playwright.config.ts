import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  forbidOnly: true,
  reporter: 'list',
  timeout: 30_000,
  workers: 1,
  use: {
    channel: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
});
