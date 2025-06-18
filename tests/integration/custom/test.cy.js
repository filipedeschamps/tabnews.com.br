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



describe('Password Recovery Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Initiate Password Recovery', () => {
    beforeEach(() => {
      cy.visit('/cadastro/recuperar');
    });

    it('should display the recovery form', () => {
      cy.get('h1').should('contain', 'Recuperação de senha');
      cy.get('form').should('be.visible');
      cy.get('input[name="userInput"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Recuperar');
    });

    it('should validate required email/username field', () => {
      cy.get('button[type="submit"]').click();
      cy.get('form').contains('Campo obrigatório').should('be.visible');
    });

    it('should handle valid email submission', () => {
      const testEmail = 'test@example.com';
      cy.get('input[name="userInput"]').type(testEmail);
      cy.intercept('POST', '/api/v1/recovery', {
        statusCode: 201,
        body: {},
      }).as('recoveryRequest');

      cy.get('button[type="submit"]').click();
      cy.wait('@recoveryRequest').its('request.body').should('deep.equal', {
        email: testEmail,
      });

      cy.contains(
        `Caso o e-mail "${testEmail}" esteja cadastrado, um link será enviado para definir uma nova senha.`,
      ).should('be.visible');
    });

    it('should handle valid username submission', () => {
      const testUsername = 'testUser';
      cy.get('input[name="userInput"]').type(testUsername);
      cy.intercept('POST', '/api/v1/recovery', {
        statusCode: 201,
        body: {},
      }).as('recoveryRequest');

      cy.get('button[type="submit"]').click();
      cy.wait('@recoveryRequest').its('request.body').should('deep.equal', {
        username: testUsername,
      });
    });

    it('should handle API error response', () => {
      const testEmail = 'test@example.com';
      cy.get('input[name="userInput"]').type(testEmail);
      cy.intercept('POST', '/api/v1/recovery', {
        statusCode: 400,
        body: {
          key: 'email',
          message: 'E-mail inválido',
        },
      }).as('recoveryRequestError');

      cy.get('button[type="submit"]').click();
      cy.wait('@recoveryRequestError');
      cy.contains('E-mail inválido').should('be.visible');
    });

    it('should handle connection error', () => {
      const testEmail = 'test@example.com';
      cy.get('input[name="userInput"]').type(testEmail);
      cy.intercept('POST', '/api/v1/recovery', {
        forceNetworkError: true,
      }).as('networkError');

      cy.get('button[type="submit"]').click();
      cy.wait('@networkError');
      cy.contains('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.').should('be.visible');
    });
  });

  describe('Set New Password with Token', () => {
    const validToken = 'valid-token-123';

    beforeEach(() => {
      cy.visit(`/cadastro/recuperar/${validToken}`);
    });

    it('should display the password reset form', () => {
      cy.get('h1').should('contain', 'Defina uma nova senha');
      cy.get('form').should('be.visible');
      cy.get('input[type="password"]').should('have.length', 2);
      cy.get('button[type="submit"]').should('contain', 'Alterar senha');
    });

    it('should validate matching passwords', () => {
      cy.get('#passwordConfirmable').type('NewPassword123');
      cy.get('#passwordConfirmation').type('DifferentPassword123');
      cy.get('button[type="submit"]').click();

      cy.contains('Senhas não conferem.').should('be.visible');
    });

    it('should handle valid password reset', () => {
      const newPassword = 'NewSecurePassword123';

      cy.get('#passwordConfirmable').type(newPassword);
      cy.get('#passwordConfirmation').type(newPassword);

      cy.intercept('PATCH', '/api/v1/recovery', {
        statusCode: 200,
        body: {},
      }).as('resetPassword');

      cy.get('button[type="submit"]').click();

      cy.wait('@resetPassword').its('request.body').should('deep.equal', {
        token_id: validToken,
        password: newPassword,
      });

      cy.url().should('include', '/cadastro/recuperar/sucesso');
    });

    it('should handle invalid token', () => {
      const newPassword = 'NewSecurePassword123';

      cy.get('#passwordConfirmable').type(newPassword);
      cy.get('#passwordConfirmation').type(newPassword);

      cy.intercept('PATCH', '/api/v1/recovery', {
        statusCode: 400,
        body: {
          key: 'token',
          message: 'Token inválido ou expirado',
        },
      }).as('invalidToken');

      cy.get('button[type="submit"]').click();
      cy.wait('@invalidToken');

      cy.contains('Token inválido ou expirado').should('be.visible');
    });

    it('should handle password validation errors', () => {
      const weakPassword = '123';

      cy.get('#passwordConfirmable').type(weakPassword);
      cy.get('#passwordConfirmation').type(weakPassword);

      cy.get('button[type="submit"]').click();

      cy.contains('Senha deve ter de 8 a 72 caracteres.').should('be.visible');
    });
  });

  describe('Password Reset Success', () => {
    it('should display success message and login link', () => {
      cy.visit('/cadastro/recuperar/sucesso');

      cy.get('h1').should('contain', 'Nova senha definida com sucesso!');
      cy.contains('Agora você pode fazer o').should('be.visible');
      cy.get('a[href="/login"]').should('be.visible');
    });

    it('should navigate to login page when clicking the login link', () => {
      cy.visit('/cadastro/recuperar/sucesso');
      cy.get('a[href="/login"]').click();
      cy.url().should('include', '/login');
    });
  });

  describe('End-to-End Recovery Flow', () => {
    it('should complete the entire password recovery flow', () => {
      const testEmail = 'test@example.com';
      const validToken = 'valid-token-123';
      const newPassword = 'NewSecurePassword123';

      cy.visit('/cadastro/recuperar');
      cy.get('input[name="userInput"]').type(testEmail);

      cy.intercept('POST', '/api/v1/recovery', {
        statusCode: 201,
        body: {},
      }).as('initiateRecovery');

      cy.get('button[type="submit"]').click();
      cy.wait('@initiateRecovery');

      cy.visit(`/cadastro/recuperar/${validToken}`);

      cy.get('#passwordConfirmable').type(newPassword);
      cy.get('#passwordConfirmation').type(newPassword);

      cy.intercept('PATCH', '/api/v1/recovery', {
        statusCode: 200,
        body: {},
      }).as('completeRecovery');

      cy.get('button[type="submit"]').click();
      cy.wait('@completeRecovery');

      cy.url().should('include', '/cadastro/recuperar/sucesso');
      cy.get('h1').should('contain', 'Nova senha definida com sucesso!');

      cy.get('main a[href="/login"]').click();
      cy.url().should('include', '/login');

    });
  });
});
