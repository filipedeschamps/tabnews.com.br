const { join, resolve } = require('path');
import database from 'infra/database.js';
import migrationRunner from 'node-pg-migrate';
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
  } catch (error) {
    throw error;
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
  } catch (error) {
    throw error;
  } finally {
    await databaseClient.end();
  }
}

export default {
  listPendingMigrations,
  runPendingMigrations,
};
