import defineConfig from '@tabnews/config/vitest';
import { config } from 'dotenv';
import { defaultExclude } from 'vitest/config';

config();

export default defineConfig({
  test: {
    server: { deps: { inline: ['@tabnews/ui'] } },
    isolate: false,
    setupFiles: ['tests/setup.js'],
    workspace: [
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
          exclude: ['**/integration/**', '**/interface/**', ...defaultExclude],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['**/interface/**/*.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
