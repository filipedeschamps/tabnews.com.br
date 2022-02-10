import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import numberOfFilesInFolder from 'tests/numberOfFilesInFolder.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
});

describe('[e2e] First GET to /api/v1/migrations', () => {
  test('should list all pending migrations', async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder('./infra/migrations');

    const pendingMigrationsResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);
    const pendingMigrationsBody = await pendingMigrationsResponse.json();

    expect(pendingMigrationsResponse.status).toEqual(200);
    expect(pendingMigrationsBody.length).toEqual(numberOfMigrationFiles);
    expect(pendingMigrationsBody[0].path).toBeDefined();
    expect(pendingMigrationsBody[0].name).toBeDefined();
    expect(pendingMigrationsBody[0].timestamp).toBeDefined();
  });
});

describe('[e2e] First POST to /api/v1/migrations', () => {
  test('should list all migrated migrations', async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder('./infra/migrations');

    const migrationsMigratedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
      method: 'post',
    });
    const migrationsMigratedBody = await migrationsMigratedResponse.json();

    expect(migrationsMigratedResponse.status).toEqual(201);
    expect(migrationsMigratedBody.length).toEqual(numberOfMigrationFiles);
    expect(migrationsMigratedBody[0]).toHaveProperty('path');
    expect(migrationsMigratedBody[0]).toHaveProperty('name');
    expect(migrationsMigratedBody[0]).toHaveProperty('timestamp');
  });
});

describe('[e2e] Second POST to /api/v1/migrations', () => {
  test('should list zero migrated migrations', async () => {
    const migrationsMigratedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
      method: 'post',
    });
    const migrationsMigratedBody = await migrationsMigratedResponse.json();

    expect(migrationsMigratedResponse.status).toEqual(200);
    expect(migrationsMigratedBody.length).toEqual(0);
  });
});

describe('[e2e] Second GET to /api/v1/migrations', () => {
  test('should list all zero pending', async () => {
    const pendingMigrationsResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);
    const pendingMigrationsBody = await pendingMigrationsResponse.json();

    expect(pendingMigrationsResponse.status).toEqual(200);
    expect(pendingMigrationsBody.length).toEqual(0);
  });
});

describe('[e2e] PUT to /api/v1/migrations', () => {
  test('should return 404', async () => {
    const putMigrationsResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
      method: 'put',
    });
    const putMigrationsBody = await putMigrationsResponse.json();

    expect(putMigrationsResponse.status).toEqual(404);
    expect(putMigrationsBody.name).toEqual('NotFoundError');
    expect(putMigrationsBody.message).toEqual('Não foi possível encontrar este recurso no sistema.');
    expect(putMigrationsBody.action).toEqual(
      'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.'
    );
    expect(uuidVersion(putMigrationsBody.errorId)).toEqual(4);
    expect(uuidValidate(putMigrationsBody.errorId)).toEqual(true);
    expect(uuidVersion(putMigrationsBody.requestId)).toEqual(4);
    expect(uuidValidate(putMigrationsBody.requestId)).toEqual(true);
    expect(putMigrationsBody.statusCode).toEqual(404);
    expect(putMigrationsBody.stack).toBeUndefined();
  });
});
