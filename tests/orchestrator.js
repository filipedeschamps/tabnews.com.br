import { faker } from '@faker-js/faker';
import retry from 'async-retry';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

import database from 'infra/database.js';
import migrator from 'infra/migrator.js';
import webserver from 'infra/webserver.js';
import activation from 'models/activation.js';
import balance from 'models/balance.js';
import content from 'models/content.js';
import event from 'models/event.js';
import recovery from 'models/recovery.js';
import session from 'models/session.js';
import user from 'models/user.js';

if (process.env.NODE_ENV !== 'test') {
  throw new Error({
    message: 'Orchestrator should only be used in tests',
  });
}

const webserverUrl = webserver.host;
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
      },
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
      },
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
      },
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

  const emailHtmlResponse = await fetch(`${emailServiceUrl}/messages/${lastEmailItem.id}.html`);
  const emailHtml = await emailHtmlResponse.text();
  lastEmailItem.html = emailHtml;

  return lastEmailItem;
}

async function createUser(userObject) {
  return await user.create({
    username: userObject?.username || faker.internet.userName().replace('_', '').replace('.', '').replace('-', ''),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || 'password',
    description: userObject?.description || '',
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

async function findSessionByToken(token) {
  return await session.findOneValidByToken(token);
}

async function createContent(contentObject) {
  const currentEvent = await event.create({
    type: contentObject?.parent_id ? 'create:content:text_child' : 'create:content:text_root',
    originatorUserId: contentObject?.owner_id,
  });

  const createdContent = await content.create(
    {
      parent_id: contentObject?.parent_id || undefined,
      owner_id: contentObject?.owner_id || undefined,
      title: contentObject?.title || undefined,
      slug: contentObject?.slug || undefined,
      body: contentObject?.body || faker.lorem.paragraphs(5),
      status: contentObject?.status || 'draft',
      source_url: contentObject?.source_url || undefined,
    },
    {
      eventId: currentEvent.id,
    },
  );

  await event.updateMetadata(currentEvent.id, {
    metadata: {
      id: createdContent.id,
    },
  });

  return createdContent;
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

async function createRate(contentObject, amount, fromUserId) {
  const tabCoinsRequiredAmount = 2;
  const originatorIp = faker.internet.ip();
  const transactionType = amount < 0 ? 'debit' : 'credit';

  if (!fromUserId) {
    fromUserId = randomUUID();

    await createBalance({
      balanceType: 'user:tabcoin',
      recipientId: fromUserId,
      amount: tabCoinsRequiredAmount * Math.abs(amount),
      originatorType: 'orchestrator',
      originatorId: fromUserId,
    });
  }

  for (let i = 0; i < Math.abs(amount); i++) {
    const currentEvent = await event.create({
      type: 'update:content:tabcoins',
      originatorUserId: fromUserId,
      originatorIp,
      metadata: {
        transaction_type: transactionType,
        from_user_id: fromUserId,
        content_owner_id: contentObject.owner_id,
        content_id: contentObject.id,
        amount: tabCoinsRequiredAmount,
      },
    });

    await balance.rateContent(
      {
        contentId: contentObject.id,
        contentOwnerId: contentObject.owner_id,
        fromUserId: fromUserId,
        transactionType,
      },
      {
        eventId: currentEvent.id,
      },
    );
  }
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

// Prestige does not have to be an integer, so it can be given as a fraction.
// If the denominator is 0, the respective prestige will not be created.
async function createPrestige(
  userId,
  {
    rootPrestigeNumerator = 1,
    rootPrestigeDenominator = 4,
    childPrestigeNumerator = 0,
    childPrestigeDenominator = 1,
  } = {},
) {
  if (
    rootPrestigeDenominator < 0 ||
    childPrestigeDenominator < 0 ||
    rootPrestigeDenominator > 20 ||
    childPrestigeDenominator > 20
  ) {
    throw new Error('rootPrestigeDenominator and childPrestigeDenominator must be between 0 and 20');
  }

  const rootContents = [];
  const childContents = [];

  jest.useFakeTimers({
    now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    advanceTimers: true,
  });

  for (let i = 0; i < rootPrestigeDenominator; i++) {
    rootContents.push(
      await createContent({
        owner_id: userId,
        title: faker.lorem.words(3),
        body: faker.lorem.paragraphs(1),
        status: 'published',
      }),
    );
  }

  let parentId = rootContents[0]?.id;

  if (childPrestigeDenominator && !parentId) {
    const parent = await createContent({
      owner_id: userId,
      title: faker.lorem.words(3),
      body: faker.lorem.paragraphs(1),
      status: 'draft',
    });

    parentId = parent.id;
  }

  for (let i = 0; i < childPrestigeDenominator; i++) {
    childContents.push(
      await createContent({
        parent_id: parentId,
        owner_id: userId,
        body: faker.lorem.paragraphs(1),
        status: 'published',
      }),
    );
  }

  jest.useRealTimers();

  if (rootContents.length) {
    await createBalance({
      balanceType: 'content:tabcoin',
      recipientId: rootContents[0].id,
      amount: rootPrestigeNumerator,
      originatorType: 'orchestrator',
      originatorId: rootContents[0].id,
    });
  }

  if (childContents.length) {
    await createBalance({
      balanceType: 'content:tabcoin',
      recipientId: childContents[0].id,
      amount: childPrestigeNumerator + childPrestigeDenominator,
      originatorType: 'orchestrator',
      originatorId: childContents[0].id,
    });
  }

  return [...rootContents, ...childContents];
}

async function updateRewardedAt(userId, rewardedAt) {
  const query = {
    text: `
      UPDATE
        users
      SET
        rewarded_at = $1
      WHERE
        id = $2
      RETURNING
        *
    ;`,
    values: [rewardedAt, userId],
  };

  return await database.query(query);
}

const orchestrator = {
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  webserverUrl,
  deleteAllEmails,
  getLastEmail,
  createUser,
  activateUser,
  createSession,
  findSessionByToken,
  addFeaturesToUser,
  removeFeaturesFromUser,
  createContent,
  updateContent,
  createRecoveryToken,
  createFirewallTestFunctions,
  createBalance,
  createPrestige,
  createRate,
  updateRewardedAt,
};

export default orchestrator;
