import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('DELETE /api/v1/user/2fa', () => {
  it.todo("disables 2FA if it's already enabled");
  it.todo("fails when it's not enabled");
  it.todo('fails when the user is not authenticated');
  it.todo('cancels 2fa activation if called before confirming');
});
