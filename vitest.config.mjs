import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defaultExclude, defineConfig } from 'vitest/config';

config();

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    server: { deps: { inline: ['@tabnews/ui'] } },
    globals: true,
    fileParallelism: false,
    isolate: false,
    testTimeout: 60_000,
    hookTimeout: 30_000,
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
  esbuild: {
    loader: 'jsx',
    include: /.*\.jsx?$/,
    exclude: [],
  },
});
