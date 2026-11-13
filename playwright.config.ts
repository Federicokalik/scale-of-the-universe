import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    // The tests address the site at the root, so it is built there first.
    command: 'BASE_PATH=/ npx astro build && BASE_PATH=/ npx astro preview --force --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
