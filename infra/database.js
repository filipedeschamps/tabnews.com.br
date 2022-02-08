import { Pool } from 'pg';
import { ServiceError } from 'errors/index.js';

const poolConfiguration = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false,
  },
};

// https://github.com/filipedeschamps/tabnews.com.br/issues/84
if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
  delete poolConfiguration.ssl;
}

const pool = new Pool(poolConfiguration);

async function query(query, params) {
  try {
    return await pool.query(query, params);
  } catch (error) {
    const errorObject = new ServiceError({
      message: error.message,
      context: {
        query: query.text,
      },
      errorUniqueCode: 'INFRA:DATABASE:QUERY',
      stack: new Error().stack,
    });
    console.error(errorObject);
    throw errorObject;
  }
}

async function getNewConnectedClient() {
  // When manually creating a new connection like this,
  // you need to make sure to close it afterward
  // with the .end() method.
  try {
    return await pool.connect();
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

export default Object.freeze({
  query,
  getNewConnectedClient,
});
