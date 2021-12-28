const { join, resolve } = require('path');
import database from 'infra/database.js';
import migrationRunner from 'node-pg-migrate';

export default function Migrator() {
  const defaultConfigurations = {
    dir: join(resolve('.'), 'infra', 'migrations'),
    direction: 'up',
    migrationsTable: 'migrations',
    log: () => {},
  };

  async function listPendingMigrations() {
    const databaseClient = await database.getNewConnectedClient();

    try {
      const pendingMigrations = await migrationRunner({
        ...defaultConfigurations,
        dbClient: databaseClient,
        dryRun: true,
      });

      return pendingMigrations;
    } catch (error) {
      throw error;
    } finally {
      await databaseClient.end();
    }
  }

  async function runPendingMigrations() {
    const databaseClient = await database.getNewConnectedClient();

    try {
      const migratedMigrations = await migrationRunner({
        ...defaultConfigurations,
        dbClient: databaseClient,
        dryRun: false,
      });

      return migratedMigrations;
    } catch (error) {
      throw error;
    } finally {
      await databaseClient.end();
    }
  }

  return {
    listPendingMigrations,
    runPendingMigrations,
  };
}
