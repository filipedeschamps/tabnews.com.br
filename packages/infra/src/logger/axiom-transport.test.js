import { noop } from 'packages/helpers';

const mocks = vi.hoisted(() => {
  const waitUntil = vi.fn().mockImplementation((promise) => promise);
  const ingest = vi.fn();
  const flush = vi.fn().mockResolvedValue();
  const Axiom = vi.fn().mockImplementation(() => ({
    ingest,
    flush,
  }));

  return {
    ingest,
    flush,
    Axiom,
    waitUntil,
  };
});

vi.mock('@axiomhq/js', () => ({
  Axiom: mocks.Axiom,
}));

vi.mock('@vercel/functions', () => ({
  waitUntil: mocks.waitUntil,
}));

describe('axiomTransport', () => {
  const dataset = 'test-dataset';
  const token = 'test-token';

  let axiomTransport, consoleErrorSpy;

  beforeAll(async () => {
    vi.resetModules();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    axiomTransport = await import('.').then((m) => m.axiomTransport);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('Edge runtime', () => {
    let versionsNode;

    beforeAll(() => {
      versionsNode = vi.spyOn(process.versions, 'node', 'get').mockReturnValue(undefined);
    });

    afterAll(() => {
      versionsNode.mockRestore();
    });

    it('should return undefined if node version is missing', () => {
      expect(axiomTransport({ dataset, token })).toBeUndefined();
    });
  });

  describe('Node runtime', () => {
    it('should return undefined if dataset, or token is missing', () => {
      expect(axiomTransport({ dataset: null, token: null })).toBeUndefined();
      expect(axiomTransport({ dataset, token: null })).toBeUndefined();
      expect(axiomTransport({ dataset: null, token })).toBeUndefined();
    });

    it('should create a transport', () => {
      expect(axiomTransport({ dataset, token })).toBeDefined();
    });

    it('should ingest logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: 'test log' }) + '\n');

      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 1);
      expect(mocks.ingest).toHaveBeenCalledWith(dataset, expect.objectContaining({ level: 'info', msg: 'test log' }));
    });

    it('should ingest logs in chunks', async () => {
      const transport = axiomTransport({ dataset, token });

      const logEntry = JSON.stringify({ time: new Date().toISOString(), level: 'info', msg: 'test log' });
      const part1 = logEntry.slice(0, -5);
      const part2 = logEntry.slice(-5);

      await transport.write(part1);
      await transport.write(part2);
      await transport.write('\n');

      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 1);
      expect(mocks.ingest).toHaveBeenCalledWith(dataset, expect.objectContaining({ level: 'info', msg: 'test log' }));
    });

    it('should flush without logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.flush();

      expect(mocks.waitUntil).toHaveBeenCalledWith(mocks.flush());
      expect(mocks.waitUntil).toHaveBeenCalledOnce();
    });

    it('should flush with logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 40, msg: 'test log 1' }) + '\n');
      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 50, msg: 'test log 2' }) + '\n');

      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 2);
      await transport.flush();

      expect(mocks.ingest).toHaveBeenCalledWith(dataset, expect.objectContaining({ level: 'warn', msg: 'test log 1' }));
      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'error', msg: 'test log 2' }),
      );

      expect(mocks.waitUntil).toHaveBeenCalledWith(mocks.flush());
      expect(mocks.waitUntil).toHaveBeenCalledOnce();
    });

    it('should not ingest invalid logs', async () => {
      const transport = axiomTransport({ dataset, token });

      transport.write('invalid chunk \n');

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mocks.ingest).not.toHaveBeenCalled();
      expect(mocks.waitUntil).not.toHaveBeenCalled();
    });

    it('should flush with invalid logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.write('invalid chunk\n');
      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 10, msg: 'test log 1' }) + '\n');
      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 20, msg: 'test log 2' }) + '\n');
      await transport.write('\n');
      await transport.write('invalid chunk \n');
      await transport.write('\n');
      await transport.write('\n');
      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 60, msg: 'test log 3' }) + '\n');

      await transport.flush();

      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 3);
      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'trace', msg: 'test log 1' }),
      );
      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'debug', msg: 'test log 2' }),
      );
      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'fatal', msg: 'test log 3' }),
      );
      expect(mocks.waitUntil).toHaveBeenCalledWith(mocks.flush());
      expect(mocks.waitUntil).toHaveBeenCalledTimes(2);
    });

    it('should continue logging even if an error occurs with Axiom', async () => {
      const error = new Error('test error');

      mocks.Axiom.mockImplementationOnce(({ onError }) => ({
        ingest: mocks.ingest.mockImplementationOnce(() => onError(error)),
        flush: mocks.flush,
      }));

      const transport = axiomTransport({ dataset, token });

      transport.flush();
      transport.write(JSON.stringify({ time: new Date().toISOString(), level: 'silent', msg: 'test log 1' }) + '\n');
      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 1);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending logs to Axiom:\n', error);

      transport.write(JSON.stringify({ time: new Date().toISOString(), level: 70, msg: 'test log 2' }) + '\n');
      await vi.waitUntil(() => mocks.ingest.mock.calls.length === 2);

      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'silent', msg: 'test log 1' }),
      );
      expect(mocks.ingest).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({ level: 'silent', msg: 'test log 2' }),
      );

      transport.flush();

      expect(mocks.waitUntil).toHaveBeenCalledWith(mocks.flush());
      expect(mocks.waitUntil).toHaveBeenCalledTimes(3);
    });
  });
});
