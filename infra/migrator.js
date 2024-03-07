import migrationRunner from 'node-pg-migrate';
import { join, resolve } from 'node:path';

import database from 'infra/database.js';
import logger from 'infra/logger.js';

const defaultConfigurations = {
  dir: join(resolve('.'), 'infra', 'migrations'),
  direction: 'up',
  migrationsTable: 'migrations',
  verbose: true,
  log: (log) => {
    logger.info({
      migration: log,
    });
  },
};

async function listPendingMigrations() {
  const databaseClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationRunner({
      ...defaultConfigurations,
      dbClient: databaseClient,
      dryRun: true,
      migrationsTable: 'pgmigrations',
    });

    return pendingMigrations;
  } finally {
    await databaseClient.end();
  }
}

async function runPendingMigrations() {
  const databaseClient = await database.getNewClient();

  try {
    const migratedMigrations = await migrationRunner({
      ...defaultConfigurations,
      dbClient: databaseClient,
      dryRun: false,
      migrationsTable: 'pgmigrations',
    });

    return migratedMigrations;
  } finally {
    await databaseClient.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
