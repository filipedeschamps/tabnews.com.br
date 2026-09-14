// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';

import ActiveUser from 'pages/cadastro/ativar/[token]';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// DefaultLayout renders the full app Header (session, search, theme, media query),
// which is unrelated to what this page is responsible for. Confetti needs a canvas
// context, which jsdom doesn't implement. Stub both down so the test stays focused
// on the activation flow itself.
vi.mock('@/TabNewsUI', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DefaultLayout: ({ children }) => children,
    Confetti: () => null,
  };
});

function mockActivationResponse({ status, body = {} }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('pages > cadastro > ativar > [token]', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ query: { token: 'valid-token' } });
  });

  afterEach(() => {
    // Restores only the globals stubbed by this file.
    vi.unstubAllGlobals();
  });

  it('should show a call to action to login after a successful activation', async () => {
    mockActivationResponse({ status: 200 });

    render(<ActiveUser />);

    await waitFor(() => screen.getByText('Sua conta foi ativada com sucesso!', { exact: false }));

    expect(screen.getByRole('link', { name: 'entrar na sua conta' })).toHaveAttribute('href', '/login');
  });

  it('should not show a call to action to login when the activation fails', async () => {
    mockActivationResponse({ status: 400, body: { message: 'Token de ativação inválido ou já utilizado.' } });

    render(<ActiveUser />);

    await waitFor(() => screen.getByText('Token de ativação inválido ou já utilizado.'));

    expect(screen.queryByRole('link', { name: 'entrar na sua conta' })).not.toBeInTheDocument();
  });
});
