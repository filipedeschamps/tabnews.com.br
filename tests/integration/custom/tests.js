import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await orchestrator.deleteAllEmails();
});

describe('POST /api/v1/recovery', () => {
  describe('Anonymous user', () => {
    test('Without "username" nor "email" should return 400 Bad Request', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect(responseBody).toMatchObject({
        name: 'ValidationError',
        status_code: 400,
        error_location_code: expect.any(String),
        error_id: expect.any(String),
        request_id: expect.any(String),
      });
    });

    test('With both "username" and "email" should return 400 Bad Request', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'filipedeschamps',
          email: 'filipedeschamps@email.com',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect(responseBody).toMatchObject({
        name: 'ValidationError',
        status_code: 400,
        error_location_code: expect.any(String),
        error_id: expect.any(String),
        request_id: expect.any(String),
      });
      // Optionally, check for a specific message if your API returns one
      // expect(responseBody.message).toMatch(/apenas.*username.*ou.*email/i);
    });

    test('With only username, should not return recovery token in response', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'filipedeschamps' }),
      });

      const responseBody = await response.json();

      expect([200, 201]).toContain(response.status);
      expect(responseBody.recovery_token).toBeUndefined();
      expect(Object.keys(responseBody).join(',')).not.toMatch(/recovery_token|token/i);
    });
  });

  test('All recovery tokens are invalidated after password reset', async () => {
    const user = await orchestrator.createUser();
    const t1 = await orchestrator.createRecoveryToken(user);
    const t2 = await orchestrator.createRecoveryToken(user);

    let response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery/${t1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'NovaSenha123' }),
    });
    expect([200, 201]).toContain(response.status);

    response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery/${t2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'Hackeado456' }),
    });

    expect([400, 410]).toContain(response.status);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      name: expect.any(String),
      message: expect.any(String),
      status_code: expect.any(Number),
    });
  });
});
