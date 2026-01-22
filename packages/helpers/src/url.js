import { isProduction, isServerlessRuntime } from './environment';

export const baseUrl = getBaseUrl();
export const webserverHostname = tryParseUrl(baseUrl).hostname;
export const webserverDomain = webserverHostname.replace(/^www\./, '');

const DEFAULT_TRUSTED_DOMAINS = ['tabnews.com.br', 'curso.dev', 'filipedeschamps.com.br', 'github.com'];

const NEXT_PUBLIC_TRUSTED_DOMAINS =
  process.env.NEXT_PUBLIC_TRUSTED_DOMAINS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) || [];

const externalTrustedDomains = NEXT_PUBLIC_TRUSTED_DOMAINS.length
  ? NEXT_PUBLIC_TRUSTED_DOMAINS
  : DEFAULT_TRUSTED_DOMAINS;

export const trustedDomains = [webserverDomain, ...externalTrustedDomains.filter((host) => host !== webserverDomain)];

/**
 * Returns the effective base URL for the application:
 * - In production, it uses the `NEXT_PUBLIC_WEBSERVER_HOST`.
 * - In preview, it uses the `NEXT_PUBLIC_VERCEL_URL`.
 * - In development, it uses the `NEXT_PUBLIC_WEBSERVER_HOST` and `NEXT_PUBLIC_WEBSERVER_PORT`.
 * - In browser environments, it uses the current location's origin if available.
 * - If none of the above, it defaults to 'https://www.tabnews.com.br'.
 *
 * @returns {string} The resolved base URL.
 */
export function getBaseUrl() {
  const { NEXT_PUBLIC_VERCEL_URL, NEXT_PUBLIC_WEBSERVER_HOST, NEXT_PUBLIC_WEBSERVER_PORT } = process.env;

  const protocol = isServerlessRuntime ? 'https' : 'http';

  // Vercel Production
  if (isProduction && NEXT_PUBLIC_WEBSERVER_HOST) {
    return `${protocol}://${NEXT_PUBLIC_WEBSERVER_HOST}`;
  }

  // Vercel Preview
  if (NEXT_PUBLIC_VERCEL_URL) {
    return `${protocol}://${NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Development
  if (NEXT_PUBLIC_WEBSERVER_HOST && NEXT_PUBLIC_WEBSERVER_PORT) {
    return `${protocol}://${NEXT_PUBLIC_WEBSERVER_HOST}:${NEXT_PUBLIC_WEBSERVER_PORT}`;
  }

  // Browser
  if (typeof location !== 'undefined' && location.origin) {
    return location.origin;
  }

  // Fallback
  return 'https://www.tabnews.com.br';
}

/**
 * Extracts the domain from a given link.
 *
 * @param {string | URL} link - The link to extract the domain from. Can be anything coercible to a URL.
 * @returns {string} The extracted domain, excluding 'www.' if present.
 */
export function getDomain(link) {
  const domain = tryParseUrl(link).hostname;

  if (domain.startsWith('www.')) {
    return domain.substring(4);
  }

  return domain;
}

/**
 * Checks whether a given link points to an external domain.
 *
 * @param {string | URL} link - The link to check. Can be anything coercible to a URL.
 * @returns {boolean} True if the link is external, false otherwise.
 */
export function isExternalLink(link) {
  return tryParseUrl(link).hostname !== webserverHostname;
}

/**
 * Checks if a given URL belongs to a trusted domain or subdomain.
 *
 * @param {string | URL} url - A string or URL-like input.
 * @returns {boolean} True if the domain is trusted, false otherwise.
 */
export function isTrustedDomain(url) {
  const { hostname } = tryParseUrl(url);

  return trustedDomains.some((trustedDomain) => hostname === trustedDomain || hostname?.endsWith(`.${trustedDomain}`));
}

/**
 * Replaces or removes search parameters in the current URL using `history.replaceState`.
 *
 * - If `params` is `null`, all search parameters are removed.
 * - If `params` is an object:
 *   - Keys with `string` or `number` values are added or updated in the URL.
 *   - Keys with `null` or `undefined` values are removed from the URL.
 *   - Other value types (e.g., objects, arrays) are ignored and also removed.
 *
 * In non-production environments, passing a non-object and non-null value throws an error.
 *
 * @param {Record<string, string | number | null | undefined> | null} params
 *   An object mapping query parameter names to values:
 *   - `string` or `number` to set/update the parameter;
 *   - `null` or `undefined` to remove it;
 *   Or `null` to remove all parameters.
 *
 * @throws {Error} If `params` is not an object or `null` (outside production only).
 */
export function replaceParams(params) {
  if (typeof params !== 'object' && process.env.NODE_ENV !== 'production') {
    throw new Error(`[replaceParams] Expected "params" to be an object or null, but received: "${typeof params}"`);
  }

  try {
    const url = new URL(location.href);

    if (params === null) {
      url.search = '';
      history.replaceState(history.state, '', url.toString());
      return;
    }

    Object.keys(params).forEach((key) => {
      if (typeof params[key] !== 'string' && typeof params[key] !== 'number') {
        url.searchParams.delete(key);
        return;
      }

      url.searchParams.set(key, params[key].toString());
    });

    history.replaceState(history.state, '', url.toString());
  } catch {
    /* empty */
  }
}

/**
 * Attempts to parse a value into a valid URL.
 *
 * @param {string | URL} url - Any value that can potentially be coerced into a URL string.
 * @param {string} [label='tryParseUrl'] - Label used in development error messages.
 * @returns {URL | Object} A valid URL object if parsing succeeds, otherwise an empty object.
 */
export function tryParseUrl(url, label = 'tryParseUrl') {
  if (!url) return {};

  try {
    return new URL(url, baseUrl);
  } catch {
    console.warn(`[${label}] Invalid URL passed: "${url}"`);
  }

  return {};
}
