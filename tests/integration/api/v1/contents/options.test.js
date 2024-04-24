import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe('OPTIONS /api/v1/contents', () => {
  describe('Anonymous user', () => {
    test('Should return correct CORS headers for OPTIONS method', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'options',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-methods')).toBe('GET,OPTIONS,PATCH,DELETE,POST,PUT');
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
      expect(response.headers.get('access-control-allow-headers')).toBe(
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      );
    });
  });
});
