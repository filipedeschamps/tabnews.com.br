import { expect } from '@jest/globals';
import setCookieParser from 'set-cookie-parser';
import orchestrator from 'tests/orchestrator';

export class RequestBuilder {
  request = {
    body: {},
    headers: {},
    url: '',
    method: 'GET',
  };
  response = {};
  expected = {};
  orchestrator = {};

  constructor({ url, method, body, headers }) {
    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    this.request.url = `${orchestrator.webserverUrl}/api/v1${url}`;
    this.request.method = method || 'GET';
    this.request.body = body || undefined;
    this.request.headers = headers || {};
    this.orchestrator = orchestrator;
  }

  static create({ url, method, body, headers }) {
    return new RequestBuilder({ url, method, body, headers });
  }

  async call() {
    const response = await fetch(this.request.url, {
      ...this.request,
    });

    const body = await response.json();
    const setCookieHeaderValues = response.headers.get('set-cookie');
    const parsedCookies = setCookieHeaderValues ? setCookieParser.parse(setCookieHeaderValues, { map: true }) : {};

    this.response = {
      ...response,
      status: response.status,
      body,
      parsedCookies,
    };

    return this;
  }

  expectResponseBody(expected, strict = false) {
    Object.keys(expected).forEach((key) => {
      expect(this.response.body[key]).toEqual(expected[key]);
    });
    if (strict) {
      expect(JSON.parse(JSON.stringify(this.response.body))).toStrictEqual(expected);
    }
    return this;
  }

  expectResponseStatus(expected) {
    expect(this.response.status).toEqual(expected);

    return this;
  }

  expectResponseCookie(expected, strict = false) {
    Object.keys(expected).forEach((key) => {
      expect(this.response.parsedCookies[key]).toEqual(expected[key]);
    });

    if (strict) {
      expect(JSON.parse(JSON.stringify(this.response.parsedCookies))).toStrictEqual(expected);
    }

    return this;
  }
}
