// tests/integration/api/v1/recovery/password-recovery-delivery.test.js
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import emailService from 'services/email.js'; // ajuste o caminho se necessário

// helpers: timeout for waitForFirstEmail - orchestrator usually has helper
const EMAIL_TIMEOUT_MS = 10000; // 10 segundos limite para entrega aceitável

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('POST /api/v1/recovery - password recovery email delivery (TDD)', () => {
  test('CT1 - request password recovery -> email must be delivered within timeout', async () => {
    // create and activate user
    const defaultUser = await orchestrator.createUser({ email: 'deliver.test@example.com' });
    await orchestrator.activateUser(defaultUser);

    // request password recovery
    const res = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: defaultUser.email }),
    });

    expect(res.status).toBe(200);

    // wait for the first email (with timeout)
    let confirmationEmail;
    try {
      confirmationEmail = await orchestrator.waitForFirstEmail({ timeout: EMAIL_TIMEOUT_MS });
    } catch (err) {
      // if timeout, fail the test with informative message
      throw new Error(`Email was not delivered within ${EMAIL_TIMEOUT_MS} ms`);
    }

    // basic assertions about the email
    expect(confirmationEmail.recipients).toContain(`<${defaultUser.email}>`);
    expect(confirmationEmail.subject).toMatch(/recupera/i);
  }, 30000); // test timeout 30s

  test('CT2 - if first delivery delayed, resend should deliver immediately', async () => {
    // create new user
    const user2 = await orchestrator.createUser({ email: 'resend.test@example.com' });
    await orchestrator.activateUser(user2);

    // simulate "first request" (we expect either delivered or delayed)
    await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2.email }),
    });

    // do not wait long — directly request resend endpoint (or same endpoint)
    const resendRes = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2.email }),
    });

    expect(resendRes.status).toBe(200);

    // wait for email after resend
    let emailAfterResend;
    try {
      emailAfterResend = await orchestrator.waitForFirstEmail({ timeout: 5000 });
    } catch (err) {
      throw new Error('Resent email was not delivered within 5s');
    }

    expect(emailAfterResend.recipients).toContain(`<${user2.email}>`);
  }, 30000);

  test('CT3 - repeated requests should not create multiple active tokens', async () => {
    const user3 = await orchestrator.createUser({ email: 'dup.token@example.com' });
    await orchestrator.activateUser(user3);

    // request twice in quick succession
    await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user3.email }),
    });

    await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user3.email }),
    });

    // get tokens from DB (model email recovery)
    const tokens = await emailService.findRecoveryTokensByUserId(user3.id);
    // Expect either 1 token (replaced) or tokens.length <= 2 but only one valid (depending on implementation)
    expect(tokens.length).toBeGreaterThanOrEqual(1);
    // ensure at most one valid (not expired and not used)
    const validTokens = tokens.filter(t => !t.used && new Date(t.expires_at) > new Date());
    expect(validTokens.length).toBeLessThanOrEqual(1);
  });
});
