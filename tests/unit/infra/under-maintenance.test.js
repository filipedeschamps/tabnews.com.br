const defaultMessage = 'Funcionalidade em manutenção.';
const defaultAction = 'Tente novamente mais tarde.';
const defaultStatusCode = 503;
const errorLocationCode = 'INFRA:UNDER_MAINTENANCE:CHECK:IS_UNDER_MAINTENANCE';

let originalUnderMaintenanceProcessEnv;

beforeAll(() => {
  originalUnderMaintenanceProcessEnv = process.env.UNDER_MAINTENANCE;
});

beforeEach(async () => {
  vi.resetModules();
});

afterAll(() => {
  process.env.UNDER_MAINTENANCE = originalUnderMaintenanceProcessEnv;
});

describe('infra/under-maintenance', () => {
  describe('check', () => {
    let check;

    beforeEach(async () => {
      check = await import('infra/under-maintenance').then((module) => module.default.check);
    });

    describe('when "process.env.UNDER_MAINTENANCE" is falsy', () => {
      beforeAll(() => {
        process.env.UNDER_MAINTENANCE = '';
      });

      it('should return undefined', () => {
        const request = { method: 'GET', nextUrl: { pathname: '/home' } };

        const result = check(request);

        expect(result).toBeUndefined();
      });
    });

    describe('when "process.env.UNDER_MAINTENANCE" is invalid', () => {
      beforeAll(() => {
        process.env.UNDER_MAINTENANCE = 'Invalid JSON';
      });

      it('should return undefined', () => {
        const request = { method: 'GET', nextUrl: { pathname: '/home' } };

        const result = check(request);

        expect(result).toBeUndefined();
      });
    });

    describe('when "methodsAndPaths" is []', () => {
      beforeAll(() => {
        process.env.UNDER_MAINTENANCE = '{"methodsAndPaths":[]}';
      });

      it('should return undefined', () => {
        const request = { method: 'POST', nextUrl: { pathname: '/admin' } };

        const result = check(request);

        expect(result).toBeUndefined();
      });
    });

    describe('when methodsAndPaths is defined', () => {
      beforeAll(() => {
        process.env.UNDER_MAINTENANCE = '{"methodsAndPaths":["POST /admin"]}';
      });

      it('should return the response when the request matches the maintenance conditions', () => {
        const request = { method: 'POST', nextUrl: { pathname: '/admin/home' } };

        const result = check(request);

        expect(result).toStrictEqual({
          status: defaultStatusCode,
          body: JSON.stringify({
            message: defaultMessage,
            action: defaultAction,
            error_location_code: errorLocationCode,
          }),
        });
      });

      it('should return undefined if the "path" does not match the maintenance conditions', () => {
        const request = { method: 'POST', nextUrl: { pathname: '/home' } };

        const result = check(request);

        expect(result).toBeUndefined();
      });

      it('should return undefined if the "method" does not match the maintenance conditions', () => {
        const request = { method: 'GET', nextUrl: { pathname: '/admin' } };

        const result = check(request);

        expect(result).toBeUndefined();
      });

      describe('when "message" is defined', () => {
        beforeAll(() => {
          process.env.UNDER_MAINTENANCE = '{"methodsAndPaths":["GET /home$"],"message":"Custom message"}';
        });

        it('should return the custom message', () => {
          const request = { method: 'GET', nextUrl: { pathname: '/home' } };

          const result = check(request);

          expect(result).toStrictEqual({
            status: defaultStatusCode,
            body: JSON.stringify({
              message: 'Custom message',
              action: defaultAction,
              error_location_code: errorLocationCode,
            }),
          });
        });
      });

      describe('when "action" is defined', () => {
        beforeAll(() => {
          process.env.UNDER_MAINTENANCE = '{"methodsAndPaths":["GET /home.*"],"action":"Custom action"}';
        });

        it('should return the custom action', () => {
          const request = { method: 'GET', nextUrl: { pathname: '/home' } };

          const result = check(request);

          expect(result).toStrictEqual({
            status: defaultStatusCode,
            body: JSON.stringify({
              message: defaultMessage,
              action: 'Custom action',
              error_location_code: errorLocationCode,
            }),
          });
        });
      });

      describe('when "statusCode" is defined', () => {
        beforeAll(() => {
          process.env.UNDER_MAINTENANCE = '{"methodsAndPaths":["GET /h.m.$"],"statusCode":200}';
        });

        it('should return the custom status code', () => {
          const request = { method: 'GET', nextUrl: { pathname: '/home' } };

          const result = check(request);

          expect(result).toStrictEqual({
            status: 200,
            body: JSON.stringify({
              message: defaultMessage,
              action: defaultAction,
              error_location_code: errorLocationCode,
            }),
          });
        });
      });
    });
  });
});
