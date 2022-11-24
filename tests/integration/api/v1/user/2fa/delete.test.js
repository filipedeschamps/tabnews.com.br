import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('DELETE /api/v1/user/2fa', () => {
  it("disables 2FA if it's already enabled", async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    await orchestrator.enable2FA(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
    });
    let responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('2FA desativado com sucesso!');
    new_user = await user.findOneById(new_user.id);
    expect(new_user.features).not.toContain('auth:2fa');
    expect(new_user.secret_2fa).toBeFalsy();
  });
  it("fails when it's not enabled", async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
    });
    let responseBody = await response.json();
    expect(response.status).toBe(400);
    expect(responseBody.message).toBe('O 2FA já está desligado.');
    expect(responseBody.action).toBe('Seria melhor ligá-lo antes, não é?');
    expect(responseBody.status_code).toBe(400);
    expect(responseBody.error_location_code).toBe('MODEL:USER:DISABLE_2FA:ALREADY_DISABLED');
  });
  it('fails when the user is not authenticated', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let responseBody = await response.json();
    expect(response.status).toBe(403);
    expect(responseBody.status_code).toBe(403);
    expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
    expect(responseBody.action).toBe(`Verifique se este usuário possui a feature "auth:2fa:disable".`);
    expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
  });
  it('cancels 2fa activation if called before confirming', async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    await user.enable_2fa(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
    });

    let responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('2FA desativado com sucesso!');
    new_user = await user.findOneById(new_user.id);
    expect(new_user.features).not.toContain('auth:2fa:confirm');
    expect(new_user.secret_2fa).toBeFalsy();
  });
});
