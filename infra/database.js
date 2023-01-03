import { Pool, Client } from 'pg';
import retry from 'async-retry';
import { ServiceError } from 'errors/index.js';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';
import snakeize from 'snakeize';

const configurations = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  connectionTimeoutMillis: 1000,
  idleTimeoutMillis: 30000,
  max: 1,
  ssl: {
    rejectUnauthorized: false,
  },
  allowExitOnIdle: true,
};

if (!webserver.isLambdaServer()) {
  configurations.max = 30;

  // https://github.com/filipedeschamps/tabnews.com.br/issues/84
  delete configurations.ssl;
}

const cache = {
  pool: null,
  maxConnections: null,
  reservedConnections: null,
  openedConnections: null,
  openedConnectionsLastUpdate: null,
};

async function query(query, options = {}) {
  let client;

  try {
    client = options.transaction ? options.transaction : await tryToGetNewClientFromPool();
    return await client.query(query);
  } catch (error) {
    throw parseQueryErrorAndLog(error, query);
  } finally {
    if (client && !options.transaction) {
      const tooManyConnections = await checkForTooManyConnections(client);

      client.release();
      if (tooManyConnections && webserver.isLambdaServer()) {
        await cache.pool.end();
        cache.pool = null;
      }
    }
  }
}

async function tryToGetNewClientFromPool() {
  const clientFromPool = await retry(newClientFromPool, {
    retries: webserver.isBuildTime ? 12 : 1,
    minTimeout: 150,
    maxTimeout: 5000,
    factor: 2,
  });

  return clientFromPool;

  async function newClientFromPool() {
    if (!cache.pool) {
      cache.pool = new Pool(configurations);
    }

    return await cache.pool.connect();
  }
}

async function checkForTooManyConnections(client) {
  if (webserver.isBuildTime) return false;

  const currentTime = new Date().getTime();
  const openedConnectionsMaxAge = 5000;
  const maxConnectionsTolerance = 0.7;

  if (cache.maxConnections === null || cache.reservedConnections === null) {
    const [maxConnections, reservedConnections] = await getConnectionLimits();
    cache.maxConnections = maxConnections;
    cache.reservedConnections = reservedConnections;
  }

  if (
    !cache.openedConnections === null ||
    !cache.openedConnectionsLastUpdate === null ||
    currentTime - cache.openedConnectionsLastUpdate > openedConnectionsMaxAge
  ) {
    const openedConnections = await getOpenedConnections();
    cache.openedConnections = openedConnections;
    cache.openedConnectionsLastUpdate = currentTime;
  }

  if (cache.openedConnections > (cache.maxConnections - cache.reservedConnections) * maxConnectionsTolerance) {
    return true;
  }

  return false;

  async function getConnectionLimits() {
    const [maxConnectionsResult, reservedConnectionResult] = await client.query(
      'SHOW max_connections; SHOW superuser_reserved_connections;'
    );
    return [
      maxConnectionsResult.rows[0].max_connections,
      reservedConnectionResult.rows[0].superuser_reserved_connections,
    ];
  }

  async function getOpenedConnections() {
    const openConnectionsResult = await client.query({
      text: 'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
      values: [process.env.POSTGRES_DB],
    });
    return openConnectionsResult.rows[0].opened_connections;
  }
}

async function getNewClient() {
  try {
    const client = await tryToGetNewClient();
    return client;
  } catch (error) {
    const errorObject = new ServiceError({
      message: error.message,
      errorLocationCode: 'INFRA:DATABASE:GET_NEW_CONNECTED_CLIENT',
      stack: new Error().stack,
    });
    logger.error(snakeize(errorObject));
    throw errorObject;
  }
}

async function tryToGetNewClient() {
  const client = await retry(newClient, {
    retries: 50,
    minTimeout: 0,
    factor: 2,
  });

  return client;

  // You need to close the client when you are done with it
  // using the client.end() method.
  async function newClient() {
    const client = new Client(configurations);
    await client.connect();
    return client;
  }
}

const UNIQUE_CONSTRAINT_VIOLATION = '23505';
const SERIALIZATION_FAILURE = '40001';
const UNDEFINED_FUNCTION = '42883';

function parseQueryErrorAndLog(error, query) {
  const expectedErrorsCode = [UNIQUE_CONSTRAINT_VIOLATION, SERIALIZATION_FAILURE];

  if (!webserver.isLambdaServer()) {
    expectedErrorsCode.push(UNDEFINED_FUNCTION);
  }

  const errorToReturn = new ServiceError({
    message: error.message,
    context: {
      query: query.text,
    },
    errorLocationCode: 'INFRA:DATABASE:QUERY',
    databaseErrorCode: error.code,
  });

  if (!expectedErrorsCode.includes(error.code)) {
    logger.error(snakeize(errorToReturn));
  }

  return errorToReturn;
}

async function transaction() {
  return await tryToGetNewClientFromPool();
}

export default Object.freeze({
  query,
  getNewClient,
  transaction,
  errorCodes: {
    UNIQUE_CONSTRAINT_VIOLATION,
    SERIALIZATION_FAILURE,
    UNDEFINED_FUNCTION,
  },
});
