describe('helpers/environment', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('Local', () => {
    test('Dev', async () => {
      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(false);
      expect(isProduction).toBe(false);
      expect(isServerlessRuntime).toBe(false);
    });

    test('Build', async () => {
      vi.stubEnv('NEXT_PHASE', 'phase-production-build');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(true);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(false);
      expect(isProduction).toBe(false);
      expect(isServerlessRuntime).toBe(false);
    });

    test('Production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(false);
      expect(isProduction).toBe(false); // only true if is real production hosted on Vercel
      expect(isServerlessRuntime).toBe(false);
    });
  });

  describe('Vercel Node', () => {
    test.todo('Development');

    test('Build', async () => {
      vi.stubEnv('NEXT_PHASE', 'phase-production-build');
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
      vi.stubEnv('VERCEL', '1');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(true);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(true);
      expect(isProduction).toBe(true);
      expect(isServerlessRuntime).toBe(true);
    });

    test('Production', async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
      vi.stubEnv('VERCEL', '1');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(true);
      expect(isProduction).toBe(true);
      expect(isServerlessRuntime).toBe(true);
    });

    test('Preview', async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL', '1');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(false);
      expect(isLambdaRuntime).toBe(true);
      expect(isProduction).toBe(false);
      expect(isServerlessRuntime).toBe(true);
    });
  });

  describe('Vercel Edge', () => {
    beforeAll(() => {
      vi.stubGlobal('EdgeRuntime', true);
    });

    afterAll(() => {
      vi.unstubAllGlobals();
    });

    test('Production', async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
      vi.stubEnv('VERCEL', '1');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(true);
      expect(isLambdaRuntime).toBe(false);
      expect(isProduction).toBe(true);
      expect(isServerlessRuntime).toBe(true);
    });

    test('Preview', async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL', '1');

      const { isBuildTime, isEdgeRuntime, isLambdaRuntime, isProduction, isServerlessRuntime } = await import('.');

      expect(isBuildTime).toBe(false);
      expect(isEdgeRuntime).toBe(true);
      expect(isLambdaRuntime).toBe(false);
      expect(isProduction).toBe(false);
      expect(isServerlessRuntime).toBe(true);
    });
  });
});
