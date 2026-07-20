import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    reducedMotion: 'no-preference',
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
