import orchestrator from 'tests/orchestrator.js';

describe('POST /api/v1/recovery', () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });

  it('deve retornar 404 se o email não estiver cadastrado', async () => {
    // CORREÇÃO APLICADA AQUI
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'email.nao.cadastrado@example.com',
      }),
    });

    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('O e-mail ou nome de usuário informado não está cadastrado.');
  });

  it('deve retornar 404 se o username não estiver cadastrado', async () => {
    // CORREÇÃO APLICADA AQUI
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'usuarioinexistente',
      }),
    });

    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('O e-mail ou nome de usuário informado não está cadastrado.');
  });

  it('deve retornar 201 se o email estiver cadastrado', async () => {
    const user = await orchestrator.createUser();

    // CORREÇÃO APLICADA AQUI
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
      }),
    });

    expect(response.status).toBe(201);
  });
});
