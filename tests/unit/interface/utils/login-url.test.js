import { getLoginUrl } from 'interface';

describe('getLoginUrl', () => {
  it('should encode the path so the query string is not lost', () => {
    expect(getLoginUrl('/alguem/titulo?tab=comentarios')).toBe(
      '/login?redirect=%2Falguem%2Ftitulo%3Ftab%3Dcomentarios',
    );
  });

  it('should encode the path so the hash is not lost', () => {
    expect(getLoginUrl('/alguem/titulo#comentario-123')).toBe('/login?redirect=%2Falguem%2Ftitulo%23comentario-123');
  });

  it('should encode an "&" so it does not become another query param', () => {
    expect(getLoginUrl('/alguem/titulo?tab=comentarios&pagina=2')).toBe(
      '/login?redirect=%2Falguem%2Ftitulo%3Ftab%3Dcomentarios%26pagina%3D2',
    );
  });

  it('should be read back whole by the login page', () => {
    const path = '/alguem/titulo?tab=comentarios&pagina=2#comentario-123';
    const query = new URLSearchParams(getLoginUrl(path).split('?')[1]);

    expect(query.get('redirect')).toBe(path);
  });

  it('should not redirect back to the registration flow', () => {
    expect(getLoginUrl('/cadastro')).toBe('/login');
    expect(getLoginUrl('/cadastro/recuperar')).toBe('/login');
    expect(getLoginUrl('/cadastro/confirmar')).toBe('/login');
  });

  it('should keep the login page path untouched, along with the `redirect` it may carry', () => {
    expect(getLoginUrl('/login')).toBe('/login');
    expect(getLoginUrl('/login?redirect=%2Falguem%2Ftitulo')).toBe('/login?redirect=%2Falguem%2Ftitulo');
  });

  it('should not mistake a username for a page of the authentication flow', () => {
    expect(getLoginUrl('/loginha')).toBe('/login?redirect=%2Floginha');
    expect(getLoginUrl('/cadastrador/titulo')).toBe('/login?redirect=%2Fcadastrador%2Ftitulo');
  });

  it('should return the login page when there is no path', () => {
    expect(getLoginUrl('')).toBe('/login');
    expect(getLoginUrl(undefined)).toBe('/login');
  });
});
