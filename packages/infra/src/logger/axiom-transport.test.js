import { noop } from '@tabnews/helpers';

const mocks = vi.hoisted(() => {
  const waitUntil = vi.fn().mockImplementation((promise) => promise);

  return {
    waitUntil,
  };
});

vi.mock('@vercel/functions', () => ({
  waitUntil: mocks.waitUntil,
}));

vi.spyOn(global, 'fetch');

function parseIngestEvents(call) {
  return call[1].body
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function mockOkResponse() {
  return {
    ok: true,
    status: 200,
    body: {
      cancel: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('axiomTransport', () => {
  const dataset = 'test-dataset';
  const token = 'test-token';
  const url = 'https://api.axiom.co';

  let axiomTransport, consoleErrorSpy;

  beforeAll(async () => {
    vi.resetModules();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    axiomTransport = await import('.').then((m) => m.axiomTransport);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue(mockOkResponse());
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

      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `${url}/v1/datasets/${dataset}/ingest`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-ndjson',
            Authorization: `Bearer ${token}`,
          },
          keepalive: true,
          signal: expect.any(AbortSignal),
          body: expect.any(String),
        }),
      );
      expect(parseIngestEvents(fetch.mock.calls[0])).toStrictEqual([
        expect.objectContaining({ level: 'info', msg: 'test log' }),
      ]);
    });

    it('should ingest logs in chunks', async () => {
      const transport = axiomTransport({ dataset, token });

      const logEntry = JSON.stringify({ time: new Date().toISOString(), level: 'info', msg: 'test log' });
      const part1 = logEntry.slice(0, -5);
      const part2 = logEntry.slice(-5);

      await transport.write(part1);
      await transport.write(part2);
      await transport.write('\n');

      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);

      expect(fetch).toHaveBeenCalledOnce();
      expect(parseIngestEvents(fetch.mock.calls[0])).toStrictEqual([
        expect.objectContaining({ level: 'info', msg: 'test log' }),
      ]);
    });

    it('should flush without logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.flush();

      expect(fetch).not.toHaveBeenCalled();
      expect(mocks.waitUntil).not.toHaveBeenCalled();
    });

    it('should flush with logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 40, msg: 'test log 1' }) + '\n');
      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 50, msg: 'test log 2' }) + '\n');

      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);

      expect(fetch).toHaveBeenCalledOnce();
      expect(parseIngestEvents(fetch.mock.calls[0])).toStrictEqual([
        expect.objectContaining({ level: 'warn', msg: 'test log 1' }),
        expect.objectContaining({ level: 'error', msg: 'test log 2' }),
      ]);
    });

    it('should not ingest invalid logs', async () => {
      const transport = axiomTransport({ dataset, token });

      await transport.write('invalid chunk \n');
      transport.flush();

      expect(fetch).not.toHaveBeenCalled();
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

      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);

      expect(fetch).toHaveBeenCalledOnce();
      expect(parseIngestEvents(fetch.mock.calls[0])).toStrictEqual([
        expect.objectContaining({ level: 'trace', msg: 'test log 1' }),
        expect.objectContaining({ level: 'debug', msg: 'test log 2' }),
        expect.objectContaining({ level: 'fatal', msg: 'test log 3' }),
      ]);
    });

    it('should resolve the flush promise only after the ingest settles', async () => {
      let resolveFetch;
      fetch.mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveFetch = () => res(mockOkResponse());
          }),
      );

      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: 'test log' }) + '\n');

      let flushed = false;
      const flushPromise = Promise.resolve(transport.flush()).then(() => (flushed = true));

      await vi.waitUntil(() => fetch.mock.calls.length === 1);
      expect(flushed).toBe(false);

      resolveFetch();
      await flushPromise;
      expect(flushed).toBe(true);
    });

    it('should resolve the flush promise even when the ingest fails', async () => {
      fetch.mockRejectedValueOnce(new Error('network failure'));

      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: 'test log' }) + '\n');

      await expect(transport.flush()).resolves.toBeUndefined();
    });

    it('should flush in batches when exceeding max batch size', async () => {
      const transport = axiomTransport({ dataset, token });

      for (let i = 0; i < 1001; i++) {
        transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: `log ${i}` }) + '\n');
      }

      await vi.waitUntil(() => fetch.mock.calls.length >= 1);
      expect(fetch).toHaveBeenCalledOnce();
      expect(parseIngestEvents(fetch.mock.calls[0])).toHaveLength(1000);

      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length >= 2);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(parseIngestEvents(fetch.mock.calls[1])).toHaveLength(1);
    });

    it('should log error with duration when ingest fails with network error', async () => {
      const fetchError = new Error('network failure');
      fetch.mockRejectedValueOnce(fetchError);

      const transport = axiomTransport({ dataset, token });

      await transport.write(
        JSON.stringify({ time: new Date().toISOString(), level: 'silent', msg: 'test log 1' }) + '\n',
      );
      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);
      await vi.waitUntil(() => consoleErrorSpy.mock.calls.length >= 1);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Error sending logs to Axiom \(1 events, after \d+ms\):\n$/),
        fetchError,
      );
    });

    it('should log error with duration when ingest responds with non-ok status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        body: { cancel: vi.fn().mockResolvedValue(undefined) },
      });

      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: 'test log' }) + '\n');
      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);
      await vi.waitUntil(() => consoleErrorSpy.mock.calls.length >= 1);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Error sending logs to Axiom \(1 events, after \d+ms\):\n$/),
        expect.objectContaining({ message: 'Axiom ingest failed with status 503' }),
      );
    });

    it('should continue logging even if an error occurs with Axiom', async () => {
      fetch.mockRejectedValueOnce(new Error('first error'));

      const transport = axiomTransport({ dataset, token });

      await transport.write(
        JSON.stringify({ time: new Date().toISOString(), level: 'silent', msg: 'test log 1' }) + '\n',
      );
      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 1);

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 70, msg: 'test log 2' }) + '\n');
      transport.flush();
      await vi.waitUntil(() => fetch.mock.calls.length === 2);

      expect(parseIngestEvents(fetch.mock.calls[0])).toStrictEqual([
        expect.objectContaining({ level: 'silent', msg: 'test log 1' }),
      ]);
      expect(parseIngestEvents(fetch.mock.calls[1])).toStrictEqual([
        expect.objectContaining({ level: 'silent', msg: 'test log 2' }),
      ]);
    });

    it('should cancel response body to release connection', async () => {
      const cancelSpy = vi.fn().mockResolvedValue(undefined);
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: { cancel: cancelSpy },
      });

      const transport = axiomTransport({ dataset, token });

      await transport.write(JSON.stringify({ time: new Date().toISOString(), level: 30, msg: 'test log' }) + '\n');

      transport.flush();
      await vi.waitUntil(() => cancelSpy.mock.calls.length === 1);

      expect(cancelSpy).toHaveBeenCalledOnce();
    });
  });
});
