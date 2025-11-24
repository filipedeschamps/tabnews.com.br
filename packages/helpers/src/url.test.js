import { isTrustedDomain, replaceParams, tryParseUrl } from '.';

describe('helpers/url', () => {
  beforeAll(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Constants by Environment', () => {
    const defaultTrustedDomains = ['tabnews.com.br', 'curso.dev', 'filipedeschamps.com.br', 'github.com'];

    beforeEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    afterAll(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    describe('Local', () => {
      test('Dev', async () => {
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'next_public_webserver_host1');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('http://next_public_webserver_host1:1');
        expect(webserverHostname).toBe('next_public_webserver_host1');
        expect(webserverDomain).toBe('next_public_webserver_host1');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });

      test('Build', async () => {
        vi.stubEnv('NEXT_PHASE', 'phase-production-build');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'next_public_webserver_host2');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '2');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('http://next_public_webserver_host2:2');
        expect(webserverHostname).toBe('next_public_webserver_host2');
        expect(webserverDomain).toBe('next_public_webserver_host2');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });

      test('Production', async () => {
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'next_public_webserver_host3');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('http://next_public_webserver_host3:3');
        expect(webserverHostname).toBe('next_public_webserver_host3');
        expect(webserverDomain).toBe('next_public_webserver_host3');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });
    });

    describe('Vercel Node', () => {
      test.todo('Development');

      test('Build', async () => {
        vi.stubEnv('NEXT_PHASE', 'phase-production-build');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'tabnews.com.br');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://tabnews.com.br');
        expect(webserverHostname).toBe('tabnews.com.br');
        expect(webserverDomain).toBe('tabnews.com.br');
        expect(trustedDomains).toStrictEqual(defaultTrustedDomains);
      });

      test('Production', async () => {
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'tabnews.com.br');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');
        vi.stubEnv('NEXT_PUBLIC_TRUSTED_DOMAINS', 'curso.dev');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://tabnews.com.br');
        expect(webserverHostname).toBe('tabnews.com.br');
        expect(webserverDomain).toBe('tabnews.com.br');
        expect(trustedDomains).toStrictEqual(['tabnews.com.br', 'curso.dev']);
      });

      test('Production fallbacks to VERCEL_URL when NEXT_PUBLIC_WEBSERVER_HOST is undefined', async () => {
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', undefined);
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://tabnews.vercel.app');
        expect(webserverHostname).toBe('tabnews.vercel.app');
        expect(webserverDomain).toBe('tabnews.vercel.app');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });

      test('Preview', async () => {
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'prev-tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'localhost');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://prev-tabnews.vercel.app');
        expect(webserverHostname).toBe('prev-tabnews.vercel.app');
        expect(webserverDomain).toBe('prev-tabnews.vercel.app');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });
    });

    describe('Vercel Edge', () => {
      beforeAll(() => {
        vi.stubGlobal('EdgeRuntime', true);
      });

      afterAll(() => {
        vi.unstubAllGlobals();
      });

      test('Production', async () => {
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'www.tabnews.com.br');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://www.tabnews.com.br');
        expect(webserverHostname).toBe('www.tabnews.com.br');
        expect(webserverDomain).toBe('tabnews.com.br');
        expect(trustedDomains).toStrictEqual(defaultTrustedDomains);
      });

      test('Preview', async () => {
        vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
        vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'prev-tabnews.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', 'localhost');
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_PORT', '3000');
        vi.stubEnv('VERCEL', '1');

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://prev-tabnews.vercel.app');
        expect(webserverHostname).toBe('prev-tabnews.vercel.app');
        expect(webserverDomain).toBe('prev-tabnews.vercel.app');
        expect(trustedDomains).toStrictEqual([webserverDomain, ...defaultTrustedDomains]);
      });
    });

    describe('Unknown Environment', () => {
      it('should return default values', async () => {
        vi.stubEnv('NEXT_PUBLIC_WEBSERVER_HOST', undefined);

        vi.stubGlobal('location', {});
        vi.resetModules();

        const { baseUrl, trustedDomains, webserverDomain, webserverHostname } = await import('.');

        expect(baseUrl).toBe('https://www.tabnews.com.br');
        expect(webserverHostname).toBe('www.tabnews.com.br');
        expect(webserverDomain).toBe('tabnews.com.br');
        expect(trustedDomains).toStrictEqual(defaultTrustedDomains);
      });
    });
  });

  describe('getDomain', () => {
    let getDomain;

    beforeAll(async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'base.url');
      vi.resetModules();
      ({ getDomain } = await import('.'));
    });

    it('should return the domain for all protocols', () => {
      expect(getDomain('http://github.com/web')).toBe('github.com');
      expect(getDomain('https://tabnews.com.br/user?q=1')).toBe('tabnews.com.br');
      expect(getDomain('//curso.dev')).toBe('curso.dev');
    });

    it('should return the domain and subdomain', () => {
      expect(getDomain('https://secret.tabnews.com.br')).toBe('secret.tabnews.com.br');
      expect(getDomain('https://my.custom.example.com')).toBe('my.custom.example.com');
    });

    it('should not return "www." in the beginning', () => {
      expect(getDomain('https://www.google.com')).toBe('google.com');
      expect(getDomain('https://www.example.com/fakewebsite.com')).toBe('example.com');
      expect(getDomain('https://www.www-site.co')).toBe('www-site.co');
    });

    it('should return the baseUrl domain if the address is relative', () => {
      expect(getDomain('/about')).toBe('base.url');
      expect(getDomain('/about?param=value')).toBe('base.url');
      expect(getDomain('/about#hash')).toBe('base.url');
    });
  });

  describe('isExternalLink', () => {
    let isExternalLink;

    beforeAll(async () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'tabnews.com.br');
      vi.resetModules();
      ({ isExternalLink } = await import('.'));
    });

    test('returns false for internal URL as string', () => {
      expect(isExternalLink('https://tabnews.com.br/sobre')).toBe(false);
    });

    test('returns false for internal URL as URL object', () => {
      expect(isExternalLink(new URL('https://tabnews.com.br/teste'))).toBe(false);
    });

    test('returns false if hostname matches even with path/query/hash', () => {
      expect(isExternalLink('https://tabnews.com.br/some/path?query=string#hash')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/some/path')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/some/path#hash')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/some/path?query=string')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/#hash')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/?query=string')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/#')).toBe(false);
      expect(isExternalLink('https://tabnews.com.br/?query=string#hash')).toBe(false);
    });

    test('returns true for external URL', () => {
      expect(isExternalLink('https://example.com')).toBe(true);
    });

    test('returns true for malformed URL (fallback {})', () => {
      expect(isExternalLink('http://not[a]url')).toBe(true);
    });

    test('returns true for link with different subdomain', () => {
      expect(isExternalLink('https://blog.tabnews.com.br')).toBe(true);
      expect(isExternalLink('https://www.tabnews.com.br')).toBe(true);
    });
  });

  describe('isTrustedDomain', () => {
    it('should trust default trusted domains and their subdomains', () => {
      expect(isTrustedDomain('http://www.github.com')).toBe(true);
      expect(isTrustedDomain('https://tabnews.com.br')).toBe(true);
      expect(isTrustedDomain('//curso.dev')).toBe(true);
      expect(isTrustedDomain('https://filipedeschamps.com.br')).toBe(true);
      expect(isTrustedDomain('http://sub.tabnews.com.br')).toBe(true);
    });

    it('should not trust domains that are not in the trusted list', () => {
      expect(isTrustedDomain('https://tabnews.com')).toBe(false);
      expect(isTrustedDomain('http://www.tabnews.com')).toBe(false);
      expect(isTrustedDomain('https://faketabnews.com.br')).toBe(false);
      expect(isTrustedDomain('http://ttabnews.com.br')).toBe(false);
      expect(isTrustedDomain('https://www.faketabnews.com.br')).toBe(false);
    });

    it('should trust relative paths', () => {
      expect(isTrustedDomain('/recentes')).toBe(true);
      expect(isTrustedDomain('/relevantes')).toBe(true);
      expect(isTrustedDomain('/faq')).toBe(true);
    });

    it('should handle domains without specifying the protocol as relative paths', () => {
      expect(isTrustedDomain('sub.tabnews.com.br')).toBe(true);
      expect(isTrustedDomain('example.com')).toBe(true);
      expect(isTrustedDomain('www.example.com')).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(isTrustedDomain('http://not[a]url')).toBe(false);
      expect(isTrustedDomain('')).toBe(false);
      expect(isTrustedDomain(null)).toBe(false);
      expect(isTrustedDomain(undefined)).toBe(false);
    });

    it('should trust domains from NEXT_PUBLIC_TRUSTED_DOMAINS', async () => {
      vi.resetModules();
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'base.url');
      vi.stubEnv('NEXT_PUBLIC_TRUSTED_DOMAINS', 'sub.test.com, with.space ,without.space');
      const { isTrustedDomain } = await import('.');

      expect(isTrustedDomain('http://base.url')).toBe(true);
      expect(isTrustedDomain('http://sub.test.com')).toBe(true);
      expect(isTrustedDomain('http://with.space')).toBe(true);
      expect(isTrustedDomain('http://without.space')).toBe(true);

      expect(isTrustedDomain('http://test.com')).toBe(false);
      expect(isTrustedDomain('http://nottrusted.com')).toBe(false);
      expect(isTrustedDomain('http://tabnews.com.br')).toBe(false);
    });
  });

  describe('replaceParams', () => {
    const testUrl = 'https://test.com/path?param1=value1&param2=value2&param3=value3';

    beforeEach(() => {
      vi.stubGlobal('location', {
        href: testUrl,
      });

      vi.stubGlobal('history', {
        state: {},
        replaceState: vi.fn(),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    });

    it('should replace params in the URL with the provided values', () => {
      replaceParams({
        param2: 'newValue2',
      });

      expect(history.replaceState).toHaveBeenCalledWith(
        history.state,
        '',
        'https://test.com/path?param1=value1&param2=newValue2&param3=value3',
      );
    });

    it('should remove params from the URL if the value is not a string or number', () => {
      replaceParams({
        param1: null,
        param2: undefined,
      });
      replaceParams({
        param1: {},
        param3: [],
      });

      expect(history.replaceState).toHaveBeenCalledWith(history.state, '', 'https://test.com/path?param3=value3');
      expect(history.replaceState).toHaveBeenCalledWith(history.state, '', 'https://test.com/path?param2=value2');
    });

    it('should not remove params from the URL if the value is an empty string', () => {
      replaceParams({
        param2: '',
      });

      expect(history.replaceState).toHaveBeenCalledWith(
        history.state,
        '',
        'https://test.com/path?param1=value1&param2=&param3=value3',
      );
    });

    it('should add the parameter if it does not exist', () => {
      replaceParams({
        param4: 'value4',
      });

      expect(history.replaceState).toHaveBeenCalledWith(
        history.state,
        '',
        'https://test.com/path?param1=value1&param2=value2&param3=value3&param4=value4',
      );
    });

    it('should remove all params if null is provided', () => {
      replaceParams(null);

      expect(history.replaceState).toHaveBeenCalledWith(history.state, '', 'https://test.com/path');
    });

    it('should not modify the URL if a non-existent parameter is requested for removal', () => {
      replaceParams({
        nonExistentParam1: null,
        nonExistentParam2: undefined,
        nonExistentParam3: {},
        nonExistentParam4: [],
      });

      expect(history.replaceState).toHaveBeenCalledWith(history.state, '', testUrl);
    });

    it('should not modify the URL if no params are provided', () => {
      replaceParams({});

      expect(history.replaceState).toHaveBeenCalledWith(history.state, '', testUrl);
    });

    it('should not modify the URL if no object are provided', () => {
      expect(() => replaceParams()).toThrowError(
        '[replaceParams] Expected "params" to be an object or null, but received: "undefined"',
      );
      expect(history.replaceState).not.toHaveBeenCalled();

      vi.stubEnv('NODE_ENV', 'production');

      expect(() => replaceParams()).not.toThrowError();
      expect(history.replaceState).not.toHaveBeenCalled();
    });

    it('should not throw an error if the URL is invalid', () => {
      vi.stubGlobal('location', {
        href: 'invalid.url',
      });

      expect(() => replaceParams({ param1: 'newValue1' })).not.toThrowError();
      expect(history.replaceState).not.toHaveBeenCalled();
    });

    it('should not throw an error if "href" is not defined', () => {
      vi.stubGlobal('location', {});

      expect(() => replaceParams({ param1: 'newValue1' })).not.toThrowError();
      expect(history.replaceState).not.toHaveBeenCalled();
    });

    it('should not throw an error if "location" is not defined', () => {
      vi.stubGlobal('location', undefined);

      expect(() => replaceParams({ param1: 'newValue1' })).not.toThrowError();
      expect(history.replaceState).not.toHaveBeenCalled();
    });

    it('should not throw an error if "history" is not defined', () => {
      vi.stubGlobal('history', undefined);

      expect(() => replaceParams({ param1: 'newValue1' })).not.toThrowError();
    });
  });

  describe('tryParseUrl', () => {
    it('should return a URL object for a valid absolute URL string', () => {
      const result = tryParseUrl('https://example.com');
      expect(result).toBeInstanceOf(URL);
      expect(result.href).toBe('https://example.com/');
    });

    it('should return a URL object when passing a URL instance', () => {
      const input = new URL('https://example.com');
      const result = tryParseUrl(input);
      expect(result).toStrictEqual(input);
    });

    it('should return a URL object for a relative URL', () => {
      const result = tryParseUrl('/about');
      expect(result.href).toBe('http://localhost:3000/about');
    });

    it('should return an empty object for invalid URL', () => {
      const result = tryParseUrl('https://invalid[URL]');
      expect(result).toStrictEqual({});
      expect(console.warn).toHaveBeenCalledWith('[tryParseUrl] Invalid URL passed: "https://invalid[URL]"');
    });

    it('should use the label in the warning message', () => {
      const result = tryParseUrl('https://bad[url]', 'customLabel');
      expect(result).toStrictEqual({});
      expect(console.warn).toHaveBeenCalledWith('[customLabel] Invalid URL passed: "https://bad[url]"');
    });

    it('should return an empty object for null input', () => {
      const result = tryParseUrl(null);
      expect(result).toStrictEqual({});
    });

    it('should return an empty object for undefined input', () => {
      const result = tryParseUrl(undefined);
      expect(result).toStrictEqual({});
    });

    it('should return an empty object for empty string', () => {
      const result = tryParseUrl('');
      expect(result).toStrictEqual({});
    });
  });
});
