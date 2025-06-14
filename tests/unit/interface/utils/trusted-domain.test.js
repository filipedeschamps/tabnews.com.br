import { isTrustedDomain } from '@tabnews/helpers';

describe('isTrustedDomain', () => {
  it('should trust only specific domains and their subdomains', () => {
    expect(isTrustedDomain('http://www.github.com')).toBe(true);
    expect(isTrustedDomain('https://tabnews.com.br')).toBe(true);
    expect(isTrustedDomain('//curso.dev')).toBe(true);
    expect(isTrustedDomain('https://filipedeschamps.com.br')).toBe(true);
    expect(isTrustedDomain('http://sub.tabnews.com.br')).toBe(true);
    expect(isTrustedDomain('https://www.example.com')).toBe(false);
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

  it('should check the whole domain', () => {
    expect(isTrustedDomain('https://tabnews.com.br')).toBe(true);
    expect(isTrustedDomain('https://tabnews.com')).toBe(false);
    expect(isTrustedDomain('https://faketabnews.com.br')).toBe(false);
    expect(isTrustedDomain('https://ttabnews.com.br')).toBe(false);
  });
});
