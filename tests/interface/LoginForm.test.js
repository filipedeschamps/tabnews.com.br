import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Login from '../../pages/login/index.public';

vi.mock('pages/interface', async () => {
  const original = await vi.importActual('pages/interface');
  return {
    ...original,
    useUser: () => ({
      fetchUser: vi.fn(),
      user: null,
    }),
    createErrorMessage: (msg) => msg?.message || 'erro padrão',
    Head: () => null,
  };
});

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    query: {},
    replace: vi.fn(),
    asPath: '/',
    pathname: '/',
  }),
}));

vi.mock('@tabnews/forms', () => ({
  email: {
    name: 'email',
    validate: () => null,
  },
  password: {
    name: 'password',
    validate: () => null,
  },
  useForm: () => ({
    getFieldProps: (field) => ({
      name: field,
      onChange: () => {},
      value: '',
    }),
    handleSubmit: (cb) => (event) => {
      event.preventDefault();
      cb({ email: 'user@example.com', password: '123456' });
    },
    state: {
      globalMessage: { error: null },
      loading: { value: false },
    },
    updateState: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('LoginForm - Cobertura de MC/DC', () => {
  it('TC1 - Login com sucesso (status 201)', async () => {
    fetch.mockResolvedValueOnce({
      status: 201,
      json: async () => ({}),
    });

    render(<Login />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('TC2 - Erro 400 com campo válido (key=email)', async () => {
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ key: 'email', message: 'E-mail inválido' }),
    });

    render(<Login />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('TC3 - Erro 400 com campo inválido', async () => {
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ key: 'foo', message: 'Erro desconhecido' }),
    });

    render(<Login />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('TC4 - Erro inesperado (status 500)', async () => {
    fetch.mockResolvedValueOnce({
      status: 500,
      json: async () => ({ message: 'Erro interno' }),
    });

    render(<Login />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('TC5 - Erro de rede (fetch lança exceção)', async () => {
    fetch.mockRejectedValueOnce(new Error('Erro de rede'));

    render(<Login />);
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
