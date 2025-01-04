/* eslint-disable no-console */
const { Client } = require('pg');

const endpoint = process.env.NEXT_PUBLIC_UMAMI_ENDPOINT;
const websiteDomain = `${process.env.NEXT_PUBLIC_WEBSERVER_HOST}:${process.env.NEXT_PUBLIC_WEBSERVER_PORT}`;
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const connectionString = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.UMAMI_DB}`;
const username = process.env.UMAMI_API_CLIENT_USERNAME || 'admin';
const password = process.env.UMAMI_API_CLIENT_PASSWORD || 'umami';

const client = new Client({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false,
});

configUmami();

async function configUmami() {
  console.log('\n> Waiting for Umami Server to start...');
  console.log('> Endpoint:', endpoint);

  await waitForServer();

  console.log('> Creating Umami configuration...');

  const token = await fetch(`${endpoint}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.token);

  console.log('> Token:', token);

  const websites = await fetch(`${endpoint}/api/websites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => data.data);

  let existDevWebisite;

  if (websites.length) {
    existDevWebisite = websites.some((site) => site.id === websiteId);
  }

  await client.connect();

  if (!existDevWebisite) {
    const website = await fetch(`${endpoint}/api/websites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'TabNews Dev',
        domain: websiteDomain,
      }),
    }).then((res) => res.json());

    await client.query('UPDATE website SET website_id = $1 WHERE website_id = $2;', [websiteId, website.id]);
  }

  await client.end();

  console.log('> Umami configuration created!');
}

async function waitForServer(attempts = 5) {
  try {
    return await fetch(`${endpoint}/api/heartbeat`);
  } catch (error) {
    if (attempts > 1) {
      console.log('> Umami is not ready, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return waitForServer(attempts - 1);
    }

    console.error('🔴 Umami is not ready, exiting...');
    process.exit(1);
  }
}
