import fetch from 'cross-fetch';
import retry from 'async-retry';
import database from 'infra/database.js';
import migrator from 'infra/migrator.js';

const webserverUrl = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;
const emailServiceUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForDatabase();
  await waitForEmailService();

  async function waitForWebServer() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 10) {
          console.log(`> Trying to connect to Webserver #${tries}`);
        }
        await fetch(`${webserverUrl}/api/v1/status`);
      },
      {
        retries: 25,
        minTimeout: 1,
        maxTimeout: 1000,
        factor: 1,
      }
    );
  }

  async function waitForDatabase() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 10) {
          console.log(`> Trying to connect to Database #${tries}`);
        }
        const connection = await database.getNewConnectedClient();
        await connection.end();
      },
      {
        retries: 25,
        minTimeout: 1,
        maxTimeout: 1000,
        factor: 1,
      }
    );
  }

  async function waitForEmailService() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 10) {
          console.log(`> Trying to connect to Email Service #${tries}`);
        }
        await fetch(emailServiceUrl);
      },
      {
        retries: 25,
        minTimeout: 1,
        maxTimeout: 1000,
        factor: 1,
      }
    );
  }
}

async function dropAllTables() {
  const databaseClient = await database.getNewConnectedClient();
  await databaseClient.query('drop schema public cascade; create schema public;');

  await databaseClient.end();
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function deleteAllEmails() {
  await fetch(`${emailServiceUrl}/messages`, {
    method: 'DELETE',
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailServiceUrl}/messages`);
  const emailList = await emailListResponse.json();

  if (emailList.length === 0) {
    throw new Error('No email received');
  }

  const lastEmailItem = emailList.pop();

  const emailTextResponse = await fetch(`${emailServiceUrl}/messages/${lastEmailItem.id}.plain`);
  const emailText = await emailTextResponse.text();
  lastEmailItem.text = emailText;

  return lastEmailItem;
}

export default {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  webserverUrl,
  deleteAllEmails,
  getLastEmail,
};
