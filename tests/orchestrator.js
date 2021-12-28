import fetch from 'cross-fetch';
import retry from 'async-retry';
import database from 'infra/database.js';
import migratorFactory from 'infra/migrator.js';

export default function orchestratorFactory() {
  const webserverUrl = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;

  async function waitForAllServices() {
    await waitForWebServer();
    await waitForDatabase();

    async function waitForWebServer() {
      return await retry(
        async () => {
          await fetch(`${webserverUrl}/api/v1/status`);
        },
        {
          retries: 100,
        }
      );
    }

    async function waitForDatabase() {
      return await retry(
        async () => {
          const connection = await database.getNewConnectedClient();
          await connection.end();
        },
        {
          retries: 100,
        }
      );
    }
  }

  async function dropAllTables() {
    const databaseClient = await database.getNewConnectedClient();
    await databaseClient.query('drop schema public cascade; create schema public;');

    await databaseClient.end();
  }

  async function dropAllTables() {
    const databaseClient = await database.getNewConnectedClient();
    await databaseClient.query('drop schema public cascade; create schema public;');

    await databaseClient.end();
  }

  async function runPendingMigrations() {
    const migrator = migratorFactory();
    await migrator.runPendingMigrations();
  }

  return {
    waitForAllServices,
    dropAllTables,
    runPendingMigrations,
    webserverUrl,
  };
}
