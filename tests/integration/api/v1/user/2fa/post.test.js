import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('Post /api/v1/user/2fa', () => {
  it('sends the 2fa secret and adds the `auth:2fa:confirm` feature', async () => {
    const new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    await orchestrator.enable2FA(new_user);
    const sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
    });
    const responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.ascii.length).toBe(32);
    expect(responseBody.hex.length).toBe(64);
    expect(responseBody.base32.length).toBe(52);
    expect(responseBody.otpauth_url).toMatch(/otpauth\:\/\/totp\/TabNews\%20\(.*\)\?secret=[a-zA-Z0-9]{52}/);
    expect((await user.findOneById(new_user.id)).features).toContain('auth:2fa:confirm');
  });
  it('fails when the user is not authenticated', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseBody = await response.json();
    expect(response.status).toBe(403);
    expect(responseBody.name).toBe('ForbiddenError');
    expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
    expect(responseBody.action).toBe(`Verifique se este usuário possui a feature "auth:2fa:enable".`);
    expect(responseBody.status_code).toBe(403);
    expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
  });
});
