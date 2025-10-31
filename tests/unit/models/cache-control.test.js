import { InternalServerError } from 'errors';
import { setCacheControl } from 'models/cache-control.js';

describe('setCacheControl', () => {
  let res;

  beforeEach(() => {
    res = {
      headers: {},
      getHeaders() {
        return this.headers;
      },
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
    };
  });

  it('should set the Cache-Control header if it does not exist yet', () => {
    setCacheControl(res, 'no-store');
    expect(res.getHeaders()['cache-control']).toBe('no-store');
  });

  it('should not reset the header if it already has the same value', () => {
    res.headers['cache-control'] = 'no-store';
    setCacheControl(res, 'no-store');
    expect(res.getHeaders()['cache-control']).toBe('no-store');
  });

  it('should throw InternalServerError if trying to reset Cache-Control with a different value', () => {
    setCacheControl(res, 'no-store');
    expect(() => res.setHeader('Cache-Control', 'public')).toThrow(InternalServerError);
  });

  it('should allow setting other headers normally', () => {
    setCacheControl(res, 'no-store');
    expect(() => res.setHeader('Content-Type', 'application/json')).not.toThrow();
    expect(res.getHeaders()['content-type']).toBe('application/json');
  });
});
