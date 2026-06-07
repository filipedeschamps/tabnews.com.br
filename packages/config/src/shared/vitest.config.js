import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default function createConfig(customConfig) {
  return defineConfig(
    deepMerge(
      {
        // Vite 8's native `resolve.tsconfigPaths` only reads `tsconfig.json`,
        // but this project uses `jsconfig.json` (it's plain JS), so we keep the
        // plugin for `baseUrl` resolution. Renaming it dodges Vite's "use the
        // native option instead" deprecation warning, which can't be silenced
        // otherwise and doesn't apply to us.
        plugins: [react(), { ...tsconfigPaths(), name: 'tsconfig-paths' }],
        test: {
          globals: true,
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 30_000,
        },
        oxc: {
          lang: 'jsx',
        },
      },
      customConfig,
    ),
  );
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target, source);
  return target;
}
