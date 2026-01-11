// Inspired by `@axiomhq/pino`, but compatible with `waitUntil` from `@vercel/functions`
import { Axiom } from '@axiomhq/js';
import { waitUntil } from '@vercel/functions';
import build from 'pino-abstract-transport';

export function axiomTransport({
  dataset = process.env.AXIOM_DATASET,
  token = process.env.AXIOM_TOKEN,
  url = process.env.AXIOM_URL,
} = {}) {
  if (!process?.versions?.node || !dataset || !token) return;

  let parsedCount = 0;
  let ingestedCount = 0;
  let waitingFlush = false;
  let resolve, reject;

  const axiom = new Axiom({ dataset, token, url, onError });

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

  function onError(err) {
    rejectPendingPromise(err);
    console.error('Error sending logs to Axiom:\n', err);
  }

  function parseLine(line) {
    const value = JSON.parse(line);
    parsedCount++;
    return value;
  }

  function ingestLogs(event) {
    axiom.ingest(dataset, event);
    ingestedCount++;

    if (waitingFlush) {
      flushPendingLogs();
    }
  }

  function flushPendingLogs() {
    if (ingestedCount === 0 || parsedCount > ingestedCount) {
      waitingFlush = true;
      ensurePendingPromise();
      return;
    }

    waitingFlush = false;
    waitUntil(axiom.flush());
    resolvePendingPromise();
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
