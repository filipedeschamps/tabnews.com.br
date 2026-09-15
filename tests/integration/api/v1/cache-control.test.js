import apiRoutes from 'tests/api-routes';
import orchestrator from 'tests/orchestrator.js';

// A response stored by the CDN is served to everyone, so a `Set-Cookie` in it would leak the first
// requester's credential to anyone asking for the same URL. Every cached endpoint must prove it
// never sends the header, including when the request carries a session cookie — the case where some
// middleware could try to renew or expire it.
const cachedEndpoints = [
  { endpoint: 'GET /api/v1/status', path: () => '/api/v1/status', maxAge: 5 },
  {
    endpoint: 'GET /api/v1/analytics/users-created',
    path: () => '/api/v1/analytics/users-created',
    maxAge: 300,
  },
  {
    endpoint: 'GET /api/v1/analytics/root-content-published',
    path: () => '/api/v1/analytics/root-content-published',
    maxAge: 300,
  },
  {
    endpoint: 'GET /api/v1/analytics/child-content-published',
    path: () => '/api/v1/analytics/child-content-published',
    maxAge: 300,
  },
  { endpoint: 'GET /api/v1/contents', path: () => '/api/v1/contents', maxAge: 10 },
  { endpoint: 'GET /api/v1/contents/rss', path: () => '/api/v1/contents/rss', maxAge: 60 },
  { endpoint: 'GET /api/v1/sponsored-beta', path: () => '/api/v1/sponsored-beta', maxAge: 10 },
  {
    endpoint: 'GET /api/v1/users/[username]',
    path: () => `/api/v1/users/${defaultUser.username}`,
    maxAge: 10,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]',
    path: () => `/api/v1/contents/${defaultUser.username}`,
    maxAge: 10,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]/[slug]',
    path: () => `/api/v1/contents/${defaultUser.username}/${rootContent.slug}`,
    maxAge: 10,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]/[slug]/children',
    path: () => `/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
    maxAge: 10,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]/[slug]/thumbnail',
    path: () => `/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`,
    maxAge: 60,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]/[slug]/parent',
    path: () => `/api/v1/contents/${defaultUser.username}/${childContent.slug}/parent`,
    maxAge: 10,
  },
  {
    endpoint: 'GET /api/v1/contents/[username]/[slug]/root',
    path: () => `/api/v1/contents/${defaultUser.username}/${childContent.slug}/root`,
    maxAge: 10,
  },
];

let defaultUser;
let sessionObject;
let rootContent;
let childContent;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  defaultUser = await orchestrator.createUser();
  defaultUser = await orchestrator.activateUser(defaultUser);
  sessionObject = await orchestrator.createSession(defaultUser);

  rootContent = await orchestrator.createContent({
    owner_id: defaultUser.id,
    title: 'Conteúdo raiz cacheado na CDN',
    status: 'published',
  });

  childContent = await orchestrator.createContent({
    owner_id: defaultUser.id,
    parent_id: rootContent.id,
    body: 'Conteúdo filho cacheado na CDN',
    status: 'published',
  });
});

describe('Endpoints cached by the CDN', () => {
  // The list above is written by hand, so it can silently fall behind: a route that starts being
  // cached without being added here would never be checked against `Set-Cookie`.
  it('should list every method that declares "swrMaxAge"', () => {
    const listedEndpoints = new Set(cachedEndpoints.map(({ endpoint }) => endpoint));

    const missingEndpoints = apiRoutes()
      .filter(({ policy }) => policy === 'swrMaxAge')
      .map(({ endpoint }) => endpoint)
      .filter((endpoint) => !listedEndpoints.has(endpoint));

    expect(missingEndpoints).toStrictEqual([]);
  });

  describe.each(cachedEndpoints)('$endpoint', ({ path, maxAge }) => {
    test('Should not send "Set-Cookie" to a request with a valid session', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}${path()}`, {
        headers: { cookie: `session_id=${sessionObject.token}` },
      });

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('cache-control')).toBe(`public, s-maxage=${maxAge}, stale-while-revalidate`);
      expect(response.headers.get('set-cookie')).toBeNull();
    });

    // An unknown session is the path that expires the cookie in the browser, and expiring means
    // sending `Set-Cookie`: in a cached response that would log out everyone asking for the URL.
    test('Should not send "Set-Cookie" to a request with an unknown session', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}${path()}`, {
        headers: { cookie: `session_id=${'a'.repeat(96)}` },
      });

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('cache-control')).toBe(`public, s-maxage=${maxAge}, stale-while-revalidate`);
      expect(response.headers.get('set-cookie')).toBeNull();
    });
  });
});
