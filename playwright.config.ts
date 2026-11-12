import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
