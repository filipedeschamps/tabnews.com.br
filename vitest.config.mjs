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
          name: 'node',
          exclude: ['**/interface/**', ...defaultExclude],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['**/interface/**/*.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
