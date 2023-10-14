import fetch from 'cross-fetch';
import { v4 as uuidV4, version as uuidVersion } from 'uuid';

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

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:votes:others".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Should not retrieve voting data', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      let defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:votes:others".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
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

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual({ updated_at: expect.any(String), votesGraph: { edges: [], nodes: [] } });
    });

    test('Should retrieve voting data', async () => {
      orchestrator.createRate({ owner_id: privilegedUser.id, id: uuidV4() }, 2);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();
      const votesData = responseBody.votesGraph;

      expect(response.status).toEqual(200);
      expect(votesData.edges.length).toEqual(1);
      expect(votesData.edges[0].type).toEqual('credit');
      expect(votesData.edges[0].value).toEqual(1);
      expect(votesData.nodes.length).toEqual(2);
      expect(votesData.nodes[0].group).toEqual('users');
      expect(votesData.nodes[1].group).toEqual('users');
      expect(votesData.nodes[0].votes).toEqual(1);
      expect(votesData.nodes[1].votes).toEqual(1);
      expect(votesData.edges[0].from).toEqual(votesData.nodes[0].id);
      expect(votesData.edges[0].to).toEqual(votesData.nodes[1].id);
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

        expect(responseAfter.status).toEqual(403);
        expect(responseBody.name).toEqual('ForbiddenError');
        expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
        expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:votes:others".');
        expect(responseBody.status_code).toEqual(403);
        expect(uuidVersion(responseBody.error_id)).toEqual(4);
        expect(uuidVersion(responseBody.request_id)).toEqual(4);
        expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
      });
    });
  });
});
