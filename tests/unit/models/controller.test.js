import { ForbiddenError, InternalServerError, MethodNotAllowedError, ServiceError } from 'errors';
import logger from 'infra/logger.js';
import controller from 'models/controller.js';

const { handlerOptions, logRequest } = controller;

vi.mock('infra/logger.js');

describe('Controller', () => {
  describe('logRequest', () => {
    const next = vi.fn();
    const response = {
      on: vi.fn(),
    };

    beforeEach(() => {
      logger.info.mockClear();
      next.mockClear();
    });

    it('should log request information', () => {
      const request = {
        headers: {
          'x-forwarded-for': 'test',
          'user-agent': 'test',
        },
        body: {
          body: 'test',
        },
        context: {
          test: 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [request.body],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should call logger.info only with headers and body in array format', () => {
      logRequest({}, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [{}],
        body: [{}],
        context: {},
      });
      expect(next).toHaveBeenCalled();
    });

    it('should not log extra request params', () => {
      const request = {
        other: {
          'x-forwarded-for': 'test',
          'user-agent': 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [{}],
        body: [{}],
        context: {},
      });
      expect(next).toHaveBeenCalled();
    });

    it('should truncate long "requestBody.body"', () => {
      const request = {
        headers: {
          'x-forwarded-for': 'test',
          'user-agent': 'test',
        },
        body: {
          body: 'test'.repeat(1000),
        },
        context: {
          test: 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [{ body: 'test'.repeat(74) + 't...' }],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should redact sensitive data', () => {
      const request = {
        headers: {
          authorization: 'sensitive',
          cookie: 'sensitive',
          'access-control-allow-headers': 'omit',
          forwarded: 'omit',
          'x-vercel-proxy-signature': 'omit',
          'x-vercel-sc-headers': 'omit',
          'x-vercel-oidc-token': 'omit',
          'other-header': 'test',
        },
        body: {
          body: 'test',
          email: 'test@email.com',
          password: 'password',
        },
        context: {
          test: 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [
          {
            authorization: '**',
            cookie: '**',
            'other-header': 'test',
          },
        ],
        body: [{ body: 'test', email: '**', password: '**' }],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should redact sensitive data with long "body"', () => {
      const request = {
        headers: {
          authorization: 'sensitive',
          cookie: 'sensitive',
          'other-header': 'test',
        },
        body: {
          body: 'test'.repeat(1000),
          email: 'test',
          password: 'test',
        },
        context: {
          test: 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [
          {
            authorization: '**',
            cookie: '**',
            'other-header': 'test',
          },
        ],
        body: [{ body: 'test'.repeat(74) + 't...', email: '**', password: '**' }],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should log only "id" and "username" among the user data', () => {
      const request = {
        context: {
          user: {
            id: 'test_id',
            username: 'username',
            description: 'description',
          },
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [{}],
        body: [{}],
        context: {
          user: {
            id: request.context.user.id,
            username: request.context.user.username,
          },
        },
      });
      expect(next).toHaveBeenCalled();
    });

    it('should log non string "requestBody.body"', () => {
      const request = {
        headers: {
          'x-forwarded-for': 'test',
          'user-agent': 'test',
        },
        body: {
          body: { test: 'test' },
        },
        context: {
          test: 'test',
        },
      };

      logRequest(request, response, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [request.body],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('handlerOptions', () => {
    const session = {
      id: 'session_id',
      user_id: 'user_id',
      created_at: '2026-10-18T00:00:00.000Z',
      expires_at: '2026-11-17T00:00:00.000Z',
      updated_at: '2026-10-18T00:00:00.000Z',
    };

    function createRequest() {
      return {
        method: 'GET',
        url: '/api/v1/test',
        headers: { 'x-vercel-id': 'request_id' },
        socket: { remoteAddress: '127.0.0.1' },
        context: {
          requestId: 'request_id',
          clientIp: '127.0.0.1',
          user: {
            id: 'user_id',
            username: 'username',
            email: 'user@tabnews.com.br',
            description: 'description',
            features: ['read:session'],
            tabcoins: 10,
            tabcash: 5,
          },
          session,
        },
      };
    }

    function createResponse() {
      const response = {
        status: vi.fn(() => response),
        json: vi.fn(() => response),
        end: vi.fn(() => response),
        getHeader: vi.fn(),
        setHeader: vi.fn(),
      };
      return response;
    }

    const loggedContext = {
      requestId: 'request_id',
      clientIp: '127.0.0.1',
      user: { id: 'user_id', username: 'username' },
      session,
    };

    beforeEach(() => {
      logger.info.mockClear();
      logger.error.mockClear();
    });

    it('should log client errors with only "id" and "username" among the user data', () => {
      const error = new ForbiddenError({ message: 'forbidden', errorLocationCode: 'TEST:FORBIDDEN' });

      handlerOptions.onError(error, createRequest(), createResponse());

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith({ err: error, context: loggedContext });
      expect(error.requestId).toBeUndefined();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log unexpected errors with the same "errorId" returned to the client', () => {
      const cause = new Error('root cause');
      const error = new TypeError('unexpected', { cause });
      error.extraProperty = 'should not be logged';
      const response = createResponse();

      handlerOptions.onError(error, createRequest(), response);

      const responseBody = response.json.mock.calls[0][0];
      expect(logger.error).toHaveBeenCalledTimes(1);
      const [{ err, context }] = logger.error.mock.calls[0];

      expect(err).toBeInstanceOf(InternalServerError);
      expect(err).toMatchObject({
        name: 'InternalServerError',
        message: 'unexpected',
        statusCode: 500,
        errorId: responseBody.error_id,
        cause,
        stack: error.stack,
      });
      expect(err).not.toHaveProperty('extraProperty');
      expect(err.requestId).toBeUndefined();
      expect(context).toStrictEqual(loggedContext);
    });

    it('should log service errors keeping the error context apart from the request context', () => {
      const error = new ServiceError({
        message: 'database down',
        context: { query: 'SELECT 1;' },
        errorLocationCode: 'TEST:SERVICE',
        databaseErrorCode: '57P01',
      });
      const response = createResponse();

      handlerOptions.onError(error, createRequest(), response);

      const responseBody = response.json.mock.calls[0][0];
      expect(responseBody.error_id).toBe(error.errorId);
      expect(logger.error).toHaveBeenCalledTimes(1);
      const [{ err, context }] = logger.error.mock.calls[0];

      expect(err).toBeInstanceOf(ServiceError);
      expect(err).toMatchObject({
        name: 'ServiceError',
        message: 'database down',
        statusCode: 503,
        errorId: error.errorId,
        context: { query: 'SELECT 1;' },
        errorLocationCode: 'TEST:SERVICE',
        databaseErrorCode: '57P01',
        stack: error.stack,
      });
      expect(err.requestId).toBeUndefined();
      expect(context).toStrictEqual(loggedContext);
    });

    it('should log unmatched methods with only "id" and "username" among the user data', () => {
      const response = createResponse();

      handlerOptions.onNoMatch(createRequest(), response);

      expect(response.status).toHaveBeenCalledWith(405);
      expect(response.json).toHaveBeenCalledWith({
        name: 'MethodNotAllowedError',
        message: 'Método "GET" não permitido para "/api/v1/test".',
        action: 'Utilize um método HTTP válido para este recurso.',
        status_code: 405,
        error_id: expect.any(String),
        request_id: 'request_id',
      });

      expect(logger.info).toHaveBeenCalledTimes(1);
      const [{ err, context }] = logger.info.mock.calls[0];

      expect(err).toBeInstanceOf(MethodNotAllowedError);
      expect(err.requestId).toBeUndefined();
      expect(context).toStrictEqual(loggedContext);
    });
  });
});
