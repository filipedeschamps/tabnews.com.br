import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});
describe('DELETE /api/v1/user/2fa', () => {
  it.todo('sends the 2fa secret and adds the `auth:2fa:confirm` feature');
  it.todo('fails when the user is not authenticated');
});
