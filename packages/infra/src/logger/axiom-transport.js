import { noop } from '@tabnews/helpers';
import { waitUntil } from '@vercel/functions';
import build from 'pino-abstract-transport';

const INGEST_TIMEOUT_MS = 20_000;
const DEFAULT_AXIOM_URL = 'https://api.axiom.co';

export function axiomTransport({
  dataset = process.env.AXIOM_DATASET,
  token = process.env.AXIOM_TOKEN,
  url = process.env.AXIOM_URL || DEFAULT_AXIOM_URL,
} = {}) {
  if (!process?.versions?.node || !dataset || !token) return;

  const pendingEvents = [];
  const pendingIngests = [];
  const MAX_BATCH_SIZE = 1000;
  let parsedCount = 0;
  let ingestedCount = 0;
  let waitingFlush = false;
  let resolve, reject;

  const transport = build(
    async function (source) {
      for await (const obj of source) {
        const { time, level, ...rest } = obj;

        ingestLogs({
          _time: time,
          level: getLogLevel(level),
          ...rest,
        });
      }
    },
    {
      close: flushPendingLogs,
      parseLine,
    },
  );

  transport.flush = flushPendingLogs;

  return transport;

  function parseLine(line) {
    const value = JSON.parse(line);
    parsedCount++;
    return value;
  }

  function ingestLogs(event) {
    pendingEvents.push(event);
    ingestedCount++;

    if (waitingFlush) {
      flushPendingLogs();
    } else if (pendingEvents.length >= MAX_BATCH_SIZE) {
      pendingIngests.push(ingest(pendingEvents.splice(0, pendingEvents.length)));
    }
  }

  function flushPendingLogs() {
    if (parsedCount > ingestedCount) {
      waitingFlush = true;
      ensurePendingPromise();
      return;
    }

    waitingFlush = false;

    const events = pendingEvents.splice(0, pendingEvents.length);
    const allIngests = pendingIngests.splice(0);
    if (events.length > 0) allIngests.push(ingest(events));

    if (allIngests.length > 0) {
      ensurePendingPromise();
      Promise.all(allIngests).then(resolvePendingPromise, rejectPendingPromise);
    } else {
      resolvePendingPromise();
    }
  }

  async function ingest(events) {
    const start = Date.now();
    const body = events.map((event) => JSON.stringify(event)).join('\n');

    try {
      const response = await fetch(`${url}/v1/datasets/${dataset}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-ndjson',
          Authorization: `Bearer ${token}`,
        },
        body,
        signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
        keepalive: true,
      });

      response.body?.cancel().catch(noop);

      if (!response.ok) {
        onError(new Error(`Axiom ingest failed with status ${response.status}`), events.length, Date.now() - start);
      }
    } catch (err) {
      onError(err, events.length, Date.now() - start);
    }
  }

  function onError(err, eventCount, durationMs) {
    rejectPendingPromise(err);
    console.error(`Error sending logs to Axiom (${eventCount} events, after ${durationMs}ms):\n`, err);
  }

  function ensurePendingPromise() {
    if (!resolve) {
      waitUntil(
        new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        }),
      );
    }
  }

  function resolvePendingPromise() {
    if (resolve) {
      resolve();
      resolve = null;
      reject = null;
    }
  }

  function rejectPendingPromise(err) {
    if (reject) {
      reject(err);
      resolve = null;
      reject = null;
    }
  }
}

function getLogLevel(level) {
  if (typeof level === 'string') return level;

  if (level <= 10) return 'trace';
  if (level <= 20) return 'debug';
  if (level <= 30) return 'info';
  if (level <= 40) return 'warn';
  if (level <= 50) return 'error';
  if (level <= 60) return 'fatal';

  return 'silent';
}
