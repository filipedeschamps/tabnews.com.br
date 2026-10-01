import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

const webserverOrigin = new URL(orchestrator.webserverUrl).origin;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('CSRF protection for cookie authenticated requests', () => {
  const validContent = {
    title: 'Conteúdo criado',
    body: 'Corpo do conteúdo.',
    status: 'published',
  };

  // The firewall limits content creation per IP, so the accepted cases use profile editing.
  async function buildAuthenticatedRequest(customHeaders) {
    const requestBuilder = new RequestBuilder('/api/v1');
    const defaultUser = await requestBuilder.buildUser();
    requestBuilder.buildHeaders(customHeaders);

    return {
      postContent: (requestBody = validContent) => requestBuilder.post('/contents', requestBody),
      deleteSession: () => requestBuilder.delete('/sessions'),
      patchUser: (requestBody = { description: 'Nova descrição' }) =>
        requestBuilder.patch(`/users/${defaultUser.username}`, requestBody),
    };
  }

  function crossOriginError(responseBody) {
    return {
      name: 'ForbiddenError',
      message: 'Requisições autenticadas por cookie não podem ser feitas a partir de outra origem.',
      action: 'Faça a requisição a partir da mesma origem da API.',
      status_code: 403,
      error_id: responseBody.error_id,
      request_id: responseBody.request_id,
      error_location_code: 'MODEL:AUTHENTICATION:REJECT_UNSAFE_COOKIE_REQUEST:CROSS_ORIGIN',
    };
  }

  function unsupportedContentTypeError(responseBody) {
    return {
      name: 'ValidationError',
      message: 'O "Content-Type" enviado não é suportado.',
      action: 'Envie os dados no formato JSON com o header "Content-Type: application/json".',
      status_code: 415,
      error_id: responseBody.error_id,
      request_id: responseBody.request_id,
      error_location_code: 'MODEL:CONTROLLER:ASSERT_JSON_CONTENT_TYPE:UNSUPPORTED_CONTENT_TYPE',
    };
  }

  describe('Header "Sec-Fetch-Site"', () => {
    test.each(['cross-site', 'same-site'])('Should reject "%s"', async (secFetchSite) => {
      const authenticatedRequest = await buildAuthenticatedRequest({ 'Sec-Fetch-Site': secFetchSite });

      const { response, responseBody } = await authenticatedRequest.postContent();

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual(crossOriginError(responseBody));
    });

    test.each(['same-origin', 'none'])('Should accept "%s"', async (secFetchSite) => {
      const authenticatedRequest = await buildAuthenticatedRequest({ 'Sec-Fetch-Site': secFetchSite });

      const { response } = await authenticatedRequest.patchUser();

      expect.soft(response.status).toBe(200);
    });

    test('Should reject "DELETE /sessions" from another site', async () => {
      const authenticatedRequest = await buildAuthenticatedRequest({ 'Sec-Fetch-Site': 'cross-site' });

      const { response, responseBody } = await authenticatedRequest.deleteSession();

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual(crossOriginError(responseBody));
    });

    test('Should prevail over a matching "Origin"', async () => {
      const authenticatedRequest = await buildAuthenticatedRequest({
        'Sec-Fetch-Site': 'cross-site',
        Origin: webserverOrigin,
      });

      const { response, responseBody } = await authenticatedRequest.postContent();

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual(crossOriginError(responseBody));
    });
  });

  describe('Header "Origin" without "Sec-Fetch-Site"', () => {
    test.each(['https://attacker.example', 'http://localhost:9999', 'null', 'invalid origin'])(
      'Should reject "%s"',
      async (origin) => {
        const authenticatedRequest = await buildAuthenticatedRequest({ Origin: origin });

        const { response, responseBody } = await authenticatedRequest.postContent();

        expect.soft(response.status).toBe(403);
        expect(responseBody).toStrictEqual(crossOriginError(responseBody));
      },
    );

    test('Should accept the same origin as the API', async () => {
      const authenticatedRequest = await buildAuthenticatedRequest({ Origin: webserverOrigin });

      const { response } = await authenticatedRequest.patchUser();

      expect.soft(response.status).toBe(200);
    });

    test('Should accept requests without "Origin" (non-browser API clients)', async () => {
      const authenticatedRequest = await buildAuthenticatedRequest();

      const { response } = await authenticatedRequest.patchUser();

      expect.soft(response.status).toBe(200);
    });
  });

  describe('Header "Content-Type"', () => {
    test.each([
      ['application/x-www-form-urlencoded', new URLSearchParams(validContent).toString()],
      ['multipart/form-data; boundary=----boundary', '------boundary--'],
      ['text/plain', JSON.stringify(validContent)],
    ])('Should reject "%s"', async (contentType, requestBody) => {
      const authenticatedRequest = await buildAuthenticatedRequest({ 'Content-Type': contentType });

      const { response, responseBody } = await authenticatedRequest.postContent(requestBody);

      expect.soft(response.status).toBe(415);
      expect(responseBody).toStrictEqual(unsupportedContentTypeError(responseBody));
    });

    test('Should accept "application/json" with parameters', async () => {
      const authenticatedRequest = await buildAuthenticatedRequest({
        'Content-Type': 'Application/JSON; charset=utf-8',
      });

      const { response } = await authenticatedRequest.patchUser();

      expect.soft(response.status).toBe(200);
    });

    test('Should reject body without "Content-Type"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const response = await fetch(contentsRequestBuilder.baseUrl, {
        method: 'POST',
        headers: { cookie: `session_id=${contentsRequestBuilder.sessionObject.token}` },
        body: new Blob([JSON.stringify(validContent)]),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(415);
      expect(responseBody).toStrictEqual(unsupportedContentTypeError(responseBody));
    });

    test('Should accept requests without body and "Content-Type"', async () => {
      const sessionsRequestBuilder = new RequestBuilder('/api/v1/sessions');
      await sessionsRequestBuilder.buildUser();
      const headers = sessionsRequestBuilder.buildHeaders();
      delete headers['Content-Type'];

      const { response } = await sessionsRequestBuilder.delete();

      expect.soft(response.status).toBe(200);
    });
  });

  describe('Requests not affected', () => {
    test('Safe method with cookie from another origin', async () => {
      const userRequestBuilder = new RequestBuilder('/api/v1/user');
      await userRequestBuilder.buildUser();
      userRequestBuilder.buildHeaders({ 'Sec-Fetch-Site': 'cross-site', Origin: 'https://attacker.example' });

      const { response } = await userRequestBuilder.get();

      expect.soft(response.status).toBe(200);
    });

    test('Unsafe method without cookie from another origin', async () => {
      const defaultUser = await orchestrator.createUser({ password: 'ValidPassword' });
      await orchestrator.activateUser(defaultUser);

      const sessionsRequestBuilder = new RequestBuilder('/api/v1/sessions');
      sessionsRequestBuilder.buildHeaders({ 'Sec-Fetch-Site': 'cross-site', Origin: 'https://attacker.example' });

      const { response } = await sessionsRequestBuilder.post({
        email: defaultUser.email,
        password: 'ValidPassword',
      });

      expect.soft(response.status).toBe(201);
    });
  });

  describe('Anonymous requests that create a session', () => {
    test.each(['application/x-www-form-urlencoded', 'multipart/form-data; boundary=----boundary', 'text/plain'])(
      'Should reject "POST /api/v1/sessions" with "%s"',
      async (contentType) => {
        const defaultUser = await orchestrator.createUser({ password: 'ValidPassword' });
        await orchestrator.activateUser(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: new URLSearchParams({ email: defaultUser.email, password: 'ValidPassword' }).toString(),
        });

        const responseBody = await response.json();

        expect.soft(response.status).toBe(415);
        expect(responseBody).toStrictEqual(unsupportedContentTypeError(responseBody));
        expect(response.headers.get('set-cookie')).toBeNull();
      },
    );
    test('Should reject "POST /api/v1/sessions" with body and without "Content-Type"', async () => {
      const defaultUser = await orchestrator.createUser({ password: 'ValidPassword' });
      await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        body: new Blob([JSON.stringify({ email: defaultUser.email, password: 'ValidPassword' })]),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(415);
      expect(responseBody).toStrictEqual(unsupportedContentTypeError(responseBody));
      expect(response.headers.get('set-cookie')).toBeNull();
    });
  });
});
