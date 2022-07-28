import fs from 'node:fs';
import fetch from 'cross-fetch';
import retry from 'async-retry';
import { faker } from '@faker-js/faker';
import database from 'infra/database.js';
import migrator from 'infra/migrator.js';
import user from 'models/user.js';
import activation from 'models/activation.js';
import session from 'models/session.js';
import content from 'models/content.js';
import recovery from 'models/recovery.js';
import balance from 'models/balance.js';

const webserverUrl = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;
const emailServiceUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForDatabase();
  await waitForEmailService();

  async function waitForWebServer() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 25) {
          console.log(`> Trying to connect to Webserver #${tries}. Are you running the server with "npm run dev"?`);
        }
        await fetch(`${webserverUrl}/api/v1/status`);
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      }
    );
  }

  async function waitForDatabase() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 25) {
          console.log(`> Trying to connect to Database #${tries}. Are you running the Postgres container?`);
        }
        const connection = await database.getNewClient();
        await connection.end();
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      }
    );
  }

  async function waitForEmailService() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 25) {
          console.log(`> Trying to connect to Email Service #${tries}, Are you running the MailCatcher container?`);
        }
        await fetch(emailServiceUrl);
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      }
    );
  }
}

async function dropAllTables() {
  const databaseClient = await database.getNewClient();
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
    return null;
  }

  const lastEmailItem = emailList.pop();

  const emailTextResponse = await fetch(`${emailServiceUrl}/messages/${lastEmailItem.id}.plain`);
  const emailText = await emailTextResponse.text();
  lastEmailItem.text = emailText;

  return lastEmailItem;
}

async function createUser(userObject) {
  return await user.create({
    username: userObject?.username || faker.internet.userName().replace('_', '').replace('.', ''),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || 'password',
  });
}

async function addFeaturesToUser(userObject, features) {
  return await user.addFeatures(userObject.id, features);
}

async function removeFeaturesFromUser(userObject, features) {
  return await user.removeFeatures(userObject.id, features);
}

async function activateUser(userObject) {
  return await activation.activateUserByUserId(userObject.id);
}

async function createSession(userObject) {
  return await session.create(userObject.id);
}

async function createContent(contentObject) {
  return await content.create({
    parent_id: contentObject?.parent_id || undefined,
    owner_id: contentObject?.owner_id || undefined,
    title: contentObject?.title || undefined,
    slug: contentObject?.slug || undefined,
    body: contentObject?.body || faker.lorem.paragraphs(5),
    status: contentObject?.status || 'draft',
    source_url: contentObject?.source_url || undefined,
  });
}

async function updateContent(contentId, contentObject) {
  return await content.update(contentId, {
    parent_id: contentObject?.parent_id || undefined,
    owner_id: contentObject?.owner_id || undefined,
    title: contentObject?.title || undefined,
    slug: contentObject?.slug || undefined,
    body: contentObject?.body || undefined,
    status: contentObject?.status || undefined,
    source_url: contentObject?.source_url || undefined,
  });
}

async function createBalance(balanceObject) {
  return await balance.create({
    balanceType: balanceObject.balanceType,
    recipientId: balanceObject.recipientId,
    amount: balanceObject.amount,
    originatorType: balanceObject.originatorType || 'orchestrator',
    originatorId: balanceObject.originatorId || balanceObject.recipientId,
  });
}

async function createRecoveryToken(userObject) {
  return await recovery.create(userObject);
}

async function createFirewallTestFunctions() {
  const procedures = fs.readdirSync('infra/stored-procedures');

  for (const procedureFile of procedures) {
    const procedureQuery = fs.readFileSync(`infra/stored-procedures/${procedureFile}`, 'utf8');
    await database.query(procedureQuery);
  }
}

export default {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  webserverUrl,
  deleteAllEmails,
  getLastEmail,
  createUser,
  activateUser,
  createSession,
  addFeaturesToUser,
  removeFeaturesFromUser,
  createContent,
  updateContent,
  createRecoveryToken,
  createFirewallTestFunctions,
  createBalance,
};
