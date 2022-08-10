import { UnauthorizedError } from 'errors/index.js';
import { v4 as uuidV4 } from 'uuid';
import snakeize from 'snakeize';

export default async function handler(request, response) {
  const error = new UnauthorizedError({
    message: 'Dados não conferem.',
    action: 'Verifique se os dados enviados estão corretos.',
    requestId: uuidV4(),
    errorLocationCode: 'CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH',
  });

  await fakeLatency();

  response.status(error.statusCode).json(snakeize(error));
}

async function fakeLatency() {
  const latency = random(100, 1000);
  await new Promise((r) => setTimeout(r, latency));

  function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
