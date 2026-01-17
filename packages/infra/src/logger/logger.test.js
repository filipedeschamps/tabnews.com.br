import { noop } from 'packages/helpers';

const productionLevels = ['info', 'warn', 'error', 'fatal'];
const devLevels = ['trace', 'debug', 'warn', 'error', 'fatal'];
const onlyDevLevels = ['trace', 'debug'];

const consoleLevels = {
  trace: 'trace',
  debug: 'debug',
  info: 'log',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

const dataset = 'test-dataset';
const token = 'test-token';

describe('infra/logger', () => {
  const mocks = vi.hoisted(() => ({
    axiomIngest: vi.fn(),
  }));

  vi.mock('@axiomhq/js', () => ({
    Axiom: vi.fn().mockImplementation(() => ({
      ingest: mocks.axiomIngest,
      flush: vi.fn().mockResolvedValue(),
    })),
  }));

  let stdoutSpy;
  const consoleSpy = {};

  beforeAll(() => {
    vi.stubEnv('AXIOM_DATASET', dataset);
    vi.stubEnv('AXIOM_TOKEN', token);

    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(noop);

    Object.keys(consoleLevels).forEach((level) => {
      consoleSpy[level] =
        consoleSpy[consoleLevels[level]] || vi.spyOn(console, consoleLevels[level]).mockImplementation(noop);
    });
  });

  let logger;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    logger = await import('..').then((m) => m.getLogger).then((getLogger) => getLogger());
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('Development (via console)', () => {
    beforeAll(() => {
      vi.stubEnv('VERCEL_ENV', '');
      vi.stubEnv('AXIOM_DATASET', '');
    });

    afterAll(() => {
      vi.stubEnv('AXIOM_DATASET', dataset);
    });

    it('should log dev levels', () => {
      devLevels.forEach((level) => logger[level]('logger.' + level));

      devLevels.forEach((level) => {
        expect(consoleSpy[level]).toHaveBeenCalledWith('logger.' + level);
      });

      expect(mocks.axiomIngest).not.toHaveBeenCalled();
    });

    it('should ignore "info" level', () => {
      logger.info('logger.info');

      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should not throw error on flush', () => {
      expect(logger.flush).not.toThrow();
    });

    describe('with "LOG_LEVEL" set to "info"', () => {
      beforeAll(() => {
        vi.stubEnv('LOG_LEVEL', 'info');
      });

      afterAll(() => {
        vi.stubEnv('LOG_LEVEL', '');
      });

      it('should log level "info"', () => {
        logger.info('logger.info');

        expect(consoleSpy.info).toHaveBeenCalledWith('logger.info');
      });
    });

    describe('with "AXIOM_DATASET" set', () => {
      beforeAll(() => {
        vi.stubEnv('AXIOM_TOKEN', '');
        vi.stubEnv('AXIOM_DATASET', dataset);
      });

      afterAll(() => {
        vi.stubEnv('AXIOM_TOKEN', token);
        vi.stubEnv('AXIOM_DATASET', '');
      });

      it('should log production levels via stdout', async () => {
        productionLevels.forEach((level) => logger[level]('logger.' + level));

        await vi.waitUntil(() => stdoutSpy.mock.calls.length === productionLevels.length);

        productionLevels.forEach((level) => {
          expect(stdoutSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              new RegExp(`{"level":\\d+,"time":\\d+,"environment":"test","msg":"logger.${level}"}`),
            ),
          );
        });

        expect(mocks.axiomIngest).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge runtime (via stdout)', () => {
    let nodeVersionSpy;

    beforeAll(() => {
      vi.stubEnv('VERCEL_ENV', 'production');
      nodeVersionSpy = vi.spyOn(process.versions, 'node', 'get').mockReturnValue();
    });

    afterAll(() => {
      nodeVersionSpy.mockRestore();
    });

    it('should log production levels', async () => {
      productionLevels.forEach((level) => logger[level]('logger.' + level));

      await vi.waitUntil(() => stdoutSpy.mock.calls.length === productionLevels.length);

      productionLevels.forEach((level) => {
        expect(stdoutSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(`{"level":\\d+,"time":\\d+,"environment":"production","msg":"logger.${level}"}`),
          ),
        );
      });

      expect(mocks.axiomIngest).not.toHaveBeenCalled();
    });

    it('should ignore dev levels', async () => {
      onlyDevLevels.forEach((level) => logger[level]('logger.' + level));

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should not throw error on flush', () => {
      expect(() => logger.flush()).not.toThrow();
    });
  });

  describe('Node runtime (via Axiom)', () => {
    beforeAll(() => {
      vi.stubEnv('VERCEL_ENV', 'production');
    });

    it('should log production levels', async () => {
      productionLevels.forEach((level) => logger[level]('logger.' + level));

      await vi.waitUntil(() => mocks.axiomIngest.mock.calls.length === productionLevels.length);

      productionLevels.forEach((level) => {
        expect(mocks.axiomIngest).toHaveBeenCalledWith(
          dataset,
          expect.objectContaining({ level, msg: 'logger.' + level }),
        );
      });
    });

    it('should ignore dev levels', async () => {
      onlyDevLevels.forEach((level) => logger[level]('logger.' + level));

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mocks.axiomIngest).not.toHaveBeenCalled();
    });

    it('should not throw error on flush', () => {
      expect(() => logger.flush()).not.toThrow();
    });
  });

  describe('With pino options', () => {
    it('should pass pino options to logger', async () => {
      const options = { base: { key: 'value' } };
      logger = await import('..').then((m) => m.getLogger).then((getLogger) => getLogger(options));

      logger.info('logger.info');

      await vi.waitUntil(() => mocks.axiomIngest.mock.calls.length === 1);
      expect(mocks.axiomIngest).toHaveBeenCalledWith(dataset, expect.objectContaining({ key: 'value' }));
    });

    it('should pass redact options to pino', async () => {
      const options = { redact: ['key'] };
      logger = await import('..').then((m) => m.getLogger).then((getLogger) => getLogger(options));

      logger.info({ key: 'value' });

      await vi.waitUntil(() => mocks.axiomIngest.mock.calls.length === 1);
      expect(mocks.axiomIngest).toHaveBeenCalledWith(dataset, expect.objectContaining({ key: '[Redacted]' }));
    });
  });
});
