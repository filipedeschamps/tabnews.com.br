import speakeasy from 'speakeasy';

import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('POST /api/v1/user/2fa/confirm', () => {
  it('enables 2FA if the code matches', async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    let secret = await user.enable_2fa(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa/confirm`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
      body: JSON.stringify({
        code: speakeasy.totp({
          secret: secret.base32,
          encoding: 'base32',
        }),
      }),
    });
    let responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('O 2FA foi ativado com sucesso!');
    new_user = await user.findOneById(new_user.id);
    expect(new_user.features).toContain('auth:2fa');
    expect(new_user.features).not.toContain('auth:2fa:confirm');
  });
  it("does not enable 2FA if the code doesn't match", async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    await user.enable_2fa(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa/confirm`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
      body: JSON.stringify({
        code: '000000',
      }),
    });
    let responseBody = await response.json();
    expect(responseBody.name).toBe('ValidationError');
    expect(responseBody.message).toBe(
      'Não foi possivel confirmar a ativação do 2º fator de autenticação porque o código recebido é diferente do esperado.'
    );
    expect(responseBody.action).toBe(
      'Verifique a hora do dispositivo, o código copiado para o aplicativo de 2FA e o numero enviado'
    );
    expect(responseBody.status_code).toBe(400);
    expect(responseBody.error_location_code).toBe('MODEL:USER:CONFIRM_2FA:CODE_MISMATCH');
    expect(response.status).toBe(400);
  });
  it("does not enable 2FA if the user didn't try to enable 2FA", async () => {
    let new_user = await orchestrator.createUser();
    await orchestrator.activateUser(new_user);
    let sessionObject = await orchestrator.createSession(new_user);

    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa/confirm`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${sessionObject.token}`,
      },
      body: JSON.stringify({
        code: '000000',
      }),
    });
    let responseBody = await response.json();
    expect(responseBody.name).toBe('ForbiddenError');
    expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
    expect(responseBody.action).toBe('Verifique se este usuário possui a feature "auth:2fa:confirm".');
    expect(responseBody.status_code).toBe(403);
    expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    expect(response.status).toBe(403);
  });
  it('returns error on anonymous user', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user/2fa/confirm`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: '000000',
      }),
    });
    let responseBody = await response.json();
    expect(responseBody.name).toBe('ForbiddenError');
    expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
    expect(responseBody.action).toBe('Verifique se este usuário possui a feature "auth:2fa:confirm".');
    expect(responseBody.status_code).toBe(403);
    expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    expect(response.status).toBe(403);
  });
});
