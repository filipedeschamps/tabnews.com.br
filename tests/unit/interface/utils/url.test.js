import { getDomain, isExternalLink } from 'pages/interface';
import orchestrator from 'tests/orchestrator';

describe('getDomain', () => {
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
});

describe('isExternalLink', () => {
  it('should check external link comparing to webserver URL', () => {
    expect(isExternalLink('https://www.example.com')).toBe(true);
    expect(isExternalLink('https://custom-tabnews.com.br')).toBe(true);

    expect(isExternalLink(`${orchestrator.webserverUrl}/api/v1/contents`)).toBe(false);
  });
});
