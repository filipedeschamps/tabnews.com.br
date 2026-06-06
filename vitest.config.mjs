import defineConfig from '@tabnews/config/vitest';
import { config } from 'dotenv';
import { defaultExclude } from 'vitest/config';

config();

export default defineConfig({
  test: {
    server: { deps: { inline: ['@tabnews/ui', '@primer/react'] } },
    isolate: false,
    setupFiles: ['tests/setup.js'],
    projects: [
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['**/integration/**/*.{test,spec}.{js,ts}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          isolate: true,
          exclude: ['**/integration/**', '**/interface/**', 'packages/**', ...defaultExclude],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['**/interface/**/*.{test,spec}.{js,jsx,ts,tsx}'],
          exclude: ['packages/**', ...defaultExclude],
        },
      },
      {
        extends: true,
        test: {
          name: 'packages',
          environment: 'jsdom',
          include: ['packages/**/*.{test,spec}.{js,jsx,ts,tsx}'],
          isolate: true,
        },
      },
    ],
  },
});
