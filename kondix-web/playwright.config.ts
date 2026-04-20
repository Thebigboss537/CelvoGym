import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:4200';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:5070';

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run start',
      cwd: '.',
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'dotnet run --project ../src/Kondix.Api --urls http://localhost:5070',
      cwd: '.',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
      },
    },
  ],
});
