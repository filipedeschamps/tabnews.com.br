/* eslint-disable no-console */
import { faker } from '@faker-js/faker';
import retry from 'async-retry';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import setCookieParser from 'set-cookie-parser';

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

  await setEmailTextHtml(lastEmailItem);

  return lastEmailItem;
}

async function getEmails() {
  const emailListResponse = await fetch(`${emailServiceUrl}/messages`);
  const emailList = await emailListResponse.json();

  const parsedEmails = [];

  for (const email of emailList) {
    parsedEmails.push(setEmailTextHtml(email));
  }

  const promises = await Promise.allSettled(parsedEmails);
  return promises.map((p) => p.value);
}

async function setEmailTextHtml(email) {
  const emailTextResponse = await fetch(`${emailServiceUrl}/messages/${email.id}.plain`);
  const emailText = await emailTextResponse.text();
  email.text = emailText;

  const emailHtmlResponse = await fetch(`${emailServiceUrl}/messages/${email.id}.html`);
  const emailHtml = await emailHtmlResponse.text();
  email.html = emailHtml;

  return email;
}

const usedFakeUsernames = new Set();
const usedFakeEmails = new Set();

async function createUser(userObject) {
  let username = userObject?.username;
  let email = userObject?.email;

  while (!username) {
    username = faker.internet.username().replace(/[_.-]/g, '').substring(0, 30);

    if (usedFakeUsernames.has(username)) {
      username = undefined;
    } else {
      usedFakeUsernames.add(username);
    }
  }

  while (!email) {
    email = faker.internet.email();

    if (usedFakeEmails.has(email)) {
      email = undefined;
    } else {
      usedFakeEmails.add(email);
    }
  }

  return await user.create({
    username,
    email,
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
  const contentId = contentObject?.id || randomUUID();

  const currentEvent = await event.create({
    type: contentObject?.parent_id ? 'create:content:text_child' : 'create:content:text_root',
    originator_user_id: contentObject?.owner_id,
    metadata: {
      id: contentId,
    },
  });

  const createdContent = await content.create(
    {
      id: contentId,
      parent_id: contentObject?.parent_id || undefined,
      owner_id: contentObject?.owner_id || undefined,
      title: contentObject?.title || undefined,
      slug: contentObject?.slug || undefined,
      body: contentObject?.body || faker.lorem.paragraphs(5),
      status: contentObject?.status || 'draft',
      type: contentObject?.type || 'content',
      source_url: contentObject?.source_url || undefined,
    },
    {
      eventId: currentEvent.id,
    },
  );

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
  const originator_ip = faker.internet.ip();
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
      originator_user_id: fromUserId,
      originator_ip,
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

async function updateEmailConfirmationToken(tokenId, tokenBody) {
  const query = {
    text: `
      UPDATE
        email_confirmation_tokens
      SET
        expires_at = $2
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [tokenId, tokenBody.expires_at],
  };

  const results = await database.query(query);
  return results.rows[0];
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

  vi.useFakeTimers({
    now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
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

    vi.advanceTimersByTime(10);
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

  vi.useRealTimers();

  if (rootContents.length) {
    await createBalance({
      balanceType: rootPrestigeNumerator > 0 ? 'content:tabcoin:credit' : 'content:tabcoin:debit',
      recipientId: rootContents[0].id,
      amount: rootPrestigeNumerator,
      originatorType: 'orchestrator',
      originatorId: rootContents[0].id,
    });
  }

  if (childContents.length) {
    await createBalance({
      balanceType:
        childPrestigeNumerator + childPrestigeDenominator > 0 ? 'content:tabcoin:credit' : 'content:tabcoin:debit',
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

async function getLastEvent() {
  const results = await database.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 1;');
  return results.rows[0];
}

async function updateEventCreatedAt(id, createdAt) {
  const query = {
    text: 'UPDATE events SET created_at = $1 WHERE id = $2;',
    values: [createdAt, id],
  };
  const results = await database.query(query);
  return results.rows[0];
}

function parseSetCookies(response) {
  const setCookieHeaderValues = response.headers.get('set-cookie');
  const parsedCookies = setCookieParser.parse(setCookieHeaderValues, { map: true });
  return parsedCookies;
}

const orchestrator = {
  activateUser,
  addFeaturesToUser,
  createBalance,
  createContent,
  createFirewallTestFunctions,
  createPrestige,
  createRate,
  createRecoveryToken,
  createSession,
  createUser,
  deleteAllEmails,
  dropAllTables,
  findSessionByToken,
  getEmails,
  getLastEmail,
  getLastEvent,
  parseSetCookies,
  removeFeaturesFromUser,
  runPendingMigrations,
  updateContent,
  updateEmailConfirmationToken,
  updateEventCreatedAt,
  updateRewardedAt,
  waitForAllServices,
  webserverUrl,
};

export default orchestrator;
