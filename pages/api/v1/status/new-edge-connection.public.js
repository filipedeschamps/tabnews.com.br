import { Client, neonConfig } from '@neondatabase/serverless';
import webserver from 'infra/webserver';
import ws from 'ws';

export const config = webserver.isServerlessRuntime
  ? {
      regions: ['iad1'],
      runtime: 'edge',
    }
  : undefined;

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

  const newConnectionTimer = Date.now();
  await client.connect();
  const newConnectionDuration = Date.now() - newConnectionTimer;

  await client.end();

  return response.status(201).json({
    edgeConfig: webserver.isServerlessRuntime,
    duration: newConnectionDuration,
  });
}
