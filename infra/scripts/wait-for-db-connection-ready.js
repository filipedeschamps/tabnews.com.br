/* eslint-disable no-console */
const retry = require('async-retry');
const { Client } = require('pg');

const AUTHENTICATION_FAILED = '28P01';
const INVALID_AUTHORIZATION_SPECIFICATION = '28000';

function buildDesiredConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL);
    return parsedUrl;
  }

  const requiredVariables = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB'];

  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing database environment variable(s): ${missingVariables.join(', ')}. Provide DATABASE_URL or the POSTGRES_* variables.`,
    );
  }

  return {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
  };
}

function parseDatabaseUrl(connectionString) {
  const normalized = connectionString.replace(/^postgresql:/i, 'postgres:');
  const url = new URL(normalized);
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password || '');
  const database = url.pathname.replace(/^\//, '');

  if (!user || !password || !database) {
    throw new Error('DATABASE_URL must include username, password, and database name.');
  }

  return {
    user,
    password,
    host: url.hostname,
    port: Number(url.port || '5432'),
    database,
  };
}

async function waitForDatabase() {
  const desiredConfig = buildDesiredConnectionConfig();
  const retries = Number(process.env.WAIT_FOR_DB_RETRIES || 60);
  const fallbackCredentials = getFallbackCredentials(desiredConfig);

  await retry(
    async (bail, attempt) => {
      try {
        await tryConnect(desiredConfig);
        console.log(`> Database connection succeeded after ${attempt} attempt(s).`);
        return;
      } catch (error) {
        if (shouldAttemptRecovery(error) && fallbackCredentials.length > 0) {
          console.warn('> Primary credentials rejected. Trying fallback credentials to recover access...');
          const recovered = await tryFallbackCredentials(fallbackCredentials, desiredConfig);
          if (recovered) {
            console.log('> Database credentials synchronized using fallback access.');
            return;
          }
        }

        console.log(`> Database connection failed (attempt ${attempt}): ${error.message}`);
        throw error;
      }
    },
    {
      retries,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 1.5,
    },
  );
}

function getFallbackCredentials(desiredConfig) {
  if (!process.env.POSTGRES_CREDENTIAL_FALLBACKS) return [];

  return process.env.POSTGRES_CREDENTIAL_FALLBACKS.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [user, password] = entry.split(':');
      if (!user || !password) {
        throw new Error(
          'POSTGRES_CREDENTIAL_FALLBACKS must be a comma-separated list of "user:password" entries (e.g., "local_user:local_password").',
        );
      }
      return {
        ...desiredConfig,
        user: user.trim(),
        password: password.trim(),
        database: desiredConfig.database || 'postgres',
      };
    })
    .filter(
      (credentials) => credentials.user !== desiredConfig.user || credentials.password !== desiredConfig.password,
    );
}

async function tryFallbackCredentials(fallbackCredentials, desiredConfig) {
  for (const fallback of fallbackCredentials) {
    try {
      await synchronizeCredentialsUsingFallback(fallback, desiredConfig);
      return true;
    } catch (error) {
      const authFailure = isAuthenticationError(error) || isInvalidAuthorizationError(error);
      if (authFailure) {
        console.warn(
          `> Fallback credential "${fallback.user}" rejected: ${error.message}. Trying next fallback (if any).`,
        );
        continue;
      }

      console.warn(`> Fallback credential "${fallback.user}" failed due to unexpected error: ${error.message}`);
      throw error;
    }
  }

  return false;
}

async function tryConnect(connectionConfig) {
  const client = new Client({
    ...connectionConfig,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1;');
  } finally {
    await client.end().catch(() => {});
  }
}

function isAuthenticationError(error) {
  return error && error.code === AUTHENTICATION_FAILED;
}

function isInvalidAuthorizationError(error) {
  return error && error.code === INVALID_AUTHORIZATION_SPECIFICATION;
}

function shouldAttemptRecovery(error) {
  return isAuthenticationError(error) || isInvalidAuthorizationError(error);
}

async function synchronizeCredentialsUsingFallback(fallbackConfig, desiredConfig) {
  const client = new Client({
    ...fallbackConfig,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
  });

  try {
    await client.connect();
    await ensureRole(client, desiredConfig.user, desiredConfig.password);
    await ensureDatabase(client, desiredConfig.database, desiredConfig.user);
  } finally {
    await client.end().catch(() => {});
  }

  await tryConnect(desiredConfig);
}

async function ensureRole(client, user, password) {
  const roleExists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [user]);
  const quotedUser = quoteIdentifier(user);
  const quotedPassword = quoteLiteral(password);

  if (roleExists.rowCount === 0) {
    await client.query(`CREATE ROLE ${quotedUser} WITH LOGIN SUPERUSER PASSWORD ${quotedPassword}`);
    return;
  }

  await client.query(`ALTER ROLE ${quotedUser} WITH LOGIN PASSWORD ${quotedPassword}`);
}

async function ensureDatabase(client, database, owner) {
  const dbExists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (dbExists.rowCount > 0) return;

  const quotedDb = quoteIdentifier(database);
  const quotedOwner = quoteIdentifier(owner);
  await client.query(`CREATE DATABASE ${quotedDb} OWNER ${quotedOwner}`);
}

function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteLiteral(value) {
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

waitForDatabase()
  .then(() => {
    console.log('> Database is ready.');
  })
  .catch((error) => {
    console.error('> Database did not become ready in time.');
    console.error(error);
    process.exit(1);
  });
