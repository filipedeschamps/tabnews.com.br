import { Pool, Client } from 'pg';
import retry from 'async-retry';
import { ServiceError } from 'errors/index.js';
import logger from 'infra/logger.js';
import snakeize from 'snakeize';

const configurations = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 1,
  ssl: {
    rejectUnauthorized: false,
  },
  allowExitOnIdle: true,
};

// https://github.com/filipedeschamps/tabnews.com.br/issues/84
if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
  delete configurations.ssl;
}

const cache = {
  pool: null,
  maxConnections: null,
  reservedConnections: null,
  openedConnections: null,
  openedConnectionsLastUpdate: null,
};

async function query(query, params) {
  let client;

  try {
    client = await tryToGetNewClientFromPool();
    return await client.query(query, params);
  } catch (error) {
    const errorObject = new ServiceError({
      message: error.message,
      context: {
        query: query.text,
      },
      errorUniqueCode: 'INFRA:DATABASE:QUERY',
      stack: new Error().stack,
    });
    logger.error(snakeize(errorObject));
    throw errorObject;
  } finally {
    if (client) {
      const tooManyConnections = await checkForTooManyConnections(client);

      if (tooManyConnections) {
        client.release();
        await cache.pool.end();
        cache.pool = null;
      } else {
        client.release();
      }
    }
  }
}

async function tryToGetNewClientFromPool() {
  const clientFromPool = await retry(newClientFromPool, {
    retries: 50,
    minTimeout: 0,
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
  const currentTime = new Date().getTime();
  const openedConnectionsMaxAge = 10000;
  const maxConnectionsTolerance = 0.9;

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
    const openConnectionsResult = await client.query(
      'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
      [process.env.POSTGRES_DB]
    );
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
      errorUniqueCode: 'INFRA:DATABASE:GET_NEW_CONNECTED_CLIENT',
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

export default Object.freeze({
  query,
  getNewClient,
});
