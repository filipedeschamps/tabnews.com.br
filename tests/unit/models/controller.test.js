import logger from 'infra/logger.js';
import controller from 'models/controller.js';

const { logRequest } = controller;

vi.mock('infra/logger.js');

describe('Controller', () => {
  describe('logRequest', () => {
    const next = vi.fn();

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

      logRequest(request, {}, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [request.body],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should call logger.info only with headers and body in array format', () => {
      logRequest({}, {}, next);

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

      logRequest(request, {}, next);

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

      logRequest(request, {}, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [{ body: 'test'.repeat(75) }],
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

      logRequest(request, {}, next);

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

      logRequest(request, {}, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [
          {
            authorization: '**',
            cookie: '**',
            'other-header': 'test',
          },
        ],
        body: [{ body: 'test'.repeat(75), email: '**', password: '**' }],
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

      logRequest(request, {}, next);

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

      logRequest(request, {}, next);

      expect(logger.info).toHaveBeenCalledWith({
        headers: [request.headers],
        body: [request.body],
        context: request.context,
      });
      expect(next).toHaveBeenCalled();
    });
  });
});
