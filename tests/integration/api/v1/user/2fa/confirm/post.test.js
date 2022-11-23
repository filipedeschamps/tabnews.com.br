import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('POST /api/v1/user/2fa/confirm', () => {
  it.todo('enables 2FA if the code matches');
  it.todo("does not enable 2FA if the code doesn't match");
  it.todo("does not enable 2FA if the user didn't try to enable 2FA");
  it.todo('returns error on anonymous user');
});
