import fetch from "cross-fetch";
import retry from "async-retry";
import database from "infra/database.js";

export default function orchestratorFactory() {
  const webserverUrl = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;

  async function waitForAllServices() {
    await waitForWebServer();
    await waitForDatabase();

    async function waitForWebServer() {
      return await retry(
        async () => {
          // TODO: change this for a `/status` endpoint
          await fetch(`${webserverUrl}/api/v1/migrations`);
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
    await databaseClient.query(
      "drop schema public cascade; create schema public;"
    );

    await databaseClient.end()
  }

  return {
    waitForAllServices,
    dropAllTables,
    webserverUrl,
  };
}
