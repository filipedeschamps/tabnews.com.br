import { Pool, Client } from 'pg';
import retry from 'async-retry';
import { ServiceError } from 'errors/index.js';

const configurations = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
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

const pool = new Pool(configurations);

async function query(query, params) {
  let client;

  try {
    // We stopped using pool.connect() because it was causing a lot of
    // "idle" connections in the database service due to the serverless
    // nature of Vercel (our current provider).
    client = await tryToGetNewClient();
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
    throw errorObject;
  } finally {
    if (client) {
      client.end();
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
    return await pool.connect();
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
    console.error(errorObject);
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
