import { InternalServerError } from 'errors';
import cacheControl from 'models/cache-control';

const NO_CACHE = 'no-cache, no-store, max-age=0, must-revalidate';

// Node's `getHeaders()` returns lowercased keys, which is what `setCacheControl` relies on to
// recognize the header it has already set.
function createResponse() {
  const headers = {};

  return {
    getHeaders: () => headers,
    setHeader: (name, value) => (headers[name.toLowerCase()] = value),
  };
}

function catchError(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }
}

describe('models/cache-control', () => {
  describe('noCache', () => {
    it('should set the header and call "next"', () => {
      const response = createResponse();
      const next = vi.fn();

      cacheControl.noCache(undefined, response, next);

      expect.soft(response.getHeaders()['cache-control']).toBe(NO_CACHE);
      expect(next).toHaveBeenCalledOnce();
    });

    // Overwriting it silently would hand the cache a response that sends a credential.
    it('should not allow overwriting an existing "Cache-Control"', () => {
      const response = createResponse();

      cacheControl.noCache(undefined, response);

      const error = catchError(() =>
        response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate'),
      );

      expect(error).toStrictEqual(
        new InternalServerError({
          message: 'Header Cache-Control já foi definido.',
          errorLocationCode: 'MODEL:CACHE_CONTROL:DIFFERENT_CACHE_CONTROL_ALREADY_DEFINED',
          errorId: error.errorId,
        }),
      );
    });

    it('should allow setting the same "Cache-Control" twice', () => {
      const response = createResponse();

      cacheControl.noCache(undefined, response);
      cacheControl.noCache(undefined, response);

      expect(response.getHeaders()['cache-control']).toBe(NO_CACHE);
    });
  });

  describe('swrMaxAge', () => {
    it('should set the header with the informed "maxAge"', () => {
      const response = createResponse();
      const next = vi.fn();

      cacheControl.swrMaxAge(60)(undefined, response, next);

      expect.soft(response.getHeaders()['cache-control']).toBe('public, s-maxage=60, stale-while-revalidate');
      expect(next).toHaveBeenCalledOnce();
    });

    it('should not accept a non-integer "maxAge"', () => {
      expect(catchError(() => cacheControl.swrMaxAge('60'))).toStrictEqual(new TypeError('maxAge must be an integer.'));
    });
  });

  // A storable response with a cookie is how a shared cache leaks one person's credential to
  // another. The model refuses both orders, so no new route needs to remember the rule.
  describe('Storable response with "Set-Cookie"', () => {
    it('should not allow setting the cookie after the policy', () => {
      const response = createResponse();

      cacheControl.swrMaxAge(60)(undefined, response);

      const error = catchError(() => response.setHeader('Set-Cookie', ['session_id=token; Path=/']));

      expect(error).toStrictEqual(
        new InternalServerError({
          message: 'Uma resposta que pode ser armazenada em cache não pode enviar "Set-Cookie".',
          errorLocationCode: 'MODEL:CACHE_CONTROL:SET_COOKIE_IN_STORABLE_RESPONSE',
          errorId: error.errorId,
        }),
      );
    });

    it('should not allow setting the policy after the cookie', () => {
      const response = createResponse();

      response.setHeader('Set-Cookie', ['session_id=token; Path=/']);

      const error = catchError(() => cacheControl.swrMaxAge(60)(undefined, response));

      expect.soft(error).toStrictEqual(
        new InternalServerError({
          message: 'Uma resposta que pode ser armazenada em cache não pode enviar "Set-Cookie".',
          errorLocationCode: 'MODEL:CACHE_CONTROL:SET_COOKIE_IN_STORABLE_RESPONSE',
          errorId: error.errorId,
        }),
      );

      expect(response.getHeaders()['cache-control']).toBeUndefined();
    });

    it('should allow setting the cookie in a "noCache" response', () => {
      const response = createResponse();

      cacheControl.noCache(undefined, response);
      response.setHeader('Set-Cookie', ['session_id=token; Path=/']);

      expect.soft(response.getHeaders()['set-cookie']).toStrictEqual(['session_id=token; Path=/']);
      expect(response.getHeaders()['cache-control']).toBe(NO_CACHE);
    });
  });
});
