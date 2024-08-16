import defineConfig from '@tabnews/config/vitest';

export default defineConfig({
  test: {
    environmentMatchGlobs: [['**/interface/**/*', 'jsdom']],
    setupFiles: ['tests/setup.js'],
  },
});
