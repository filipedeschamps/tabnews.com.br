import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  // await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/migrations', () => {
  describe('Anonymous user', () => {
    test('Retrieve migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);
      const responseBody = await response.json();
      console.log(responseBody);

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "migration:read".');
      expect(responseBody.statusCode).toEqual(403);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });
});
