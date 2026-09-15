import { InternalServerError } from 'errors';

function setCacheControl(res, cacheControl) {
  const cacheControlHeader = res.getHeaders()['cache-control'];

  if (cacheControlHeader?.toLowerCase() === cacheControl.toLowerCase()) return;

  // Without `no-store` the response is storable, and a shared cache would hand its `Set-Cookie` to
  // someone else. Both orders are checked, because the cookie may already be set or be set later.
  const isStorable = !cacheControl.toLowerCase().includes('no-store');

  if (isStorable && res.getHeaders()['set-cookie']) {
    throw setCookieError();
  }

  res.setHeader('Cache-Control', cacheControl);

  const setHeader = res.setHeader;

  res.setHeader = (name, value) => {
    if (name.toLowerCase() === 'cache-control') {
      throw new InternalServerError({
        message: `Header Cache-Control já foi definido.`,
        errorLocationCode: 'MODEL:CACHE_CONTROL:DIFFERENT_CACHE_CONTROL_ALREADY_DEFINED',
      });
    }

    if (isStorable && name.toLowerCase() === 'set-cookie') {
      throw setCookieError();
    }

    return setHeader(name, value);
  };
}

function setCookieError() {
  return new InternalServerError({
    message: `Uma resposta que pode ser armazenada em cache não pode enviar "Set-Cookie".`,
    errorLocationCode: 'MODEL:CACHE_CONTROL:SET_COOKIE_IN_STORABLE_RESPONSE',
  });
}

function noCache(_, res, next) {
  setCacheControl(res, 'no-cache, no-store, max-age=0, must-revalidate');
  if (next) return next();
}

function swrMaxAge(maxAge = 10) {
  if (!Number.isInteger(maxAge)) throw new TypeError('maxAge must be an integer.');

  return (_, res, next) => {
    setCacheControl(res, `public, s-maxage=${maxAge.toString()}, stale-while-revalidate`);
    if (next) return next();
  };
}

export default Object.freeze({
  noCache,
  swrMaxAge,
});
