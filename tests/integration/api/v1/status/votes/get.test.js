import { randomUUID as uuidV4 } from 'node:crypto';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/status/votes', () => {
  describe('Anonymous user', () => {
    test('Should not retrieve voting data', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`);

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "read:votes:others".');
      expect.soft(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Should not retrieve voting data', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "read:votes:others".');
      expect.soft(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with "read:votes:others" feature', () => {
    let privilegedUser;
    let privilegedUserSession;

    beforeEach(async () => {
      privilegedUser = await orchestrator.createUser();
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      privilegedUser = await orchestrator.addFeaturesToUser(privilegedUser, ['read:votes:others']);
      privilegedUserSession = await orchestrator.createSession(privilegedUser);
    });

    test('Should retrieve empty voting data', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({ updated_at: expect.any(String), votesGraph: { edges: [], nodes: [] } });
    });

    test('Should retrieve voting data', async () => {
      await orchestrator.createRate({ owner_id: privilegedUser.id, id: uuidV4() }, 1);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();
      const votesData = responseBody.votesGraph;

      expect.soft(response.status).toBe(200);
      expect(votesData.edges.length).toBe(1);
      expect(votesData.edges[0].type).toBe('credit');
      expect(votesData.edges[0].value).toBe(1);
      expect(votesData.nodes.length).toBe(2);
      expect(votesData.nodes[0].group).toBe('users');
      expect(votesData.nodes[1].group).toBe('users');
      expect(votesData.nodes[0].votes).toBe(1);
      expect(votesData.nodes[1].votes).toBe(1);
      expect(votesData.edges[0].from).toBe(votesData.nodes[0].id);
      expect(votesData.edges[0].to).toBe(votesData.nodes[1].id);
      expect(votesData.edges[0].id).toBe(`credit-${votesData.nodes[0].id}-${votesData.nodes[1].id}`);
    });

    describe('Same user after losing "read:votes:others" feature', () => {
      test('Should not retrieve voting data', async () => {
        await orchestrator.removeFeaturesFromUser(privilegedUser, ['read:votes:others']);

        const responseAfter = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSession.token}`,
          },
        });

        const responseBody = await responseAfter.json();

        expect.soft(responseAfter.status).toBe(403);
        expect(responseBody.name).toBe('ForbiddenError');
        expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
        expect(responseBody.action).toBe('Verifique se este usuário possui a feature "read:votes:others".');
        expect.soft(responseBody.status_code).toBe(403);
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
      });
    });
  });
});
