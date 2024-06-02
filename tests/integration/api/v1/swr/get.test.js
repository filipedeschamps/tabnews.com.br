import orchestrator from 'tests/orchestrator.js';

describe('GET /swr', () => {
  test('Get timestamp from server', async () => {
    const startTime = Date.now();
    const serverTimeResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/swr`);
    const serverTimeBody = await serverTimeResponse.json();
    const serverTime = serverTimeBody.timestamp;

    expect(serverTimeResponse.status).toEqual(200);
    expect(serverTime).toBeGreaterThanOrEqual(startTime);
    expect(serverTime).toBeLessThanOrEqual(Date.now());
  });
});
