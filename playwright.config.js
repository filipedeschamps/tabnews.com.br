import { defineConfig, devices } from '@playwright/test';
import { config, populate } from 'dotenv';

config({ path: './.env' });
populate(process.env, { NODE_ENV: 'test' });

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e/',
  testMatch: '**/*.spec.js',
  reporter: [['html', { open: 'never' }]],
  workers: 1,
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
