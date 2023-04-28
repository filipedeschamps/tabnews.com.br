import { Client, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const configurations = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  connectionTimeoutMillis: 2000,
};

export default async function getHandler(request, response) {
  const client = new Client(configurations);

  const newConnectionTimer = performance.now();
  await client.connect();
  const newConnectionDuration = performance.now() - newConnectionTimer;

  await client.end();

  return response.status(201).json({
    duration: newConnectionDuration,
  });
}
