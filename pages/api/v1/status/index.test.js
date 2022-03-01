import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
});

describe('[e2e] do a GET request to /api/v1/status', () => {
  test('should be able to execute all health-indicators', async () => {
    const serverStatusResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/status`);
    const serverStatusBody = await serverStatusResponse.json();

    expect(serverStatusResponse.status).toEqual(200);
    expect(serverStatusBody.updated_at).toBeDefined();
    expect(serverStatusBody.dependencies.database.status).toEqual('healthy');
    expect(serverStatusBody.dependencies.database.opened_connections).toBeGreaterThan(0);
    expect(serverStatusBody.dependencies.database.latency).toBeGreaterThan(0);

    expect(serverStatusBody.dependencies.webserver.status).toEqual('healthy');
    expect(serverStatusBody.dependencies.webserver.provider).toEqual('local');
    expect(serverStatusBody.dependencies.webserver.environment).toEqual('local');
  });
});

describe('[e2e] do a PUT request to /api/v1/status', () => {
  test('should return a 404 response', async () => {
    const putStatusResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/status`, {
      method: 'put',
    });
    const putStatusBody = await putStatusResponse.json();

    expect(putStatusResponse.status).toEqual(404);
    expect(putStatusBody.statusCode).toEqual(404);
    expect(putStatusBody.stack).toBeUndefined();
    expect(uuidVersion(putStatusBody.errorId)).toEqual(4);
    expect(uuidValidate(putStatusBody.errorId)).toEqual(true);
    expect(uuidVersion(putStatusBody.requestId)).toEqual(4);
    expect(uuidValidate(putStatusBody.requestId)).toEqual(true);
  });
});
