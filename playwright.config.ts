import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npx astro preview --force --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
