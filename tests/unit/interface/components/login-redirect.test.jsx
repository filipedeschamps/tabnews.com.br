import { ThemeProvider } from '@primer/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';

import { useMediaQuery, useUser } from 'interface';
import Content from 'interface/components/Content';
import Header from 'interface/components/Header';
import TabCoinButtons from 'interface/components/TabCoinButtons';

// Kept in a single file: these components each build the login `redirect` query
// param independently, and vitest runs this project's test files without module
// isolation (see vitest.config.js), so a shared `next/router` mock set up in one
// file leaks its return value into the next file's render. Testing them together
// keeps each `useRouter` mock scoped to the `it` that configures it.
vi.mock('next/router', () => ({ useRouter: vi.fn() }));

vi.mock('interface', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useMediaQuery: vi.fn(), useUser: vi.fn() };
});

// A path with both a query string and a hash, to make sure neither is lost in the redirect.
const CURRENT_PATH = '/alguem/titulo-do-conteudo?tab=comentarios#comentario-123';
const EXPECTED_LOGIN_URL = `/login?redirect=${encodeURIComponent(CURRENT_PATH)}`;

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('login redirect encodes the current URL (query and hash preserved)', () => {
  it('Content (compact mode): unauthenticated click on "Responder"', () => {
    const push = vi.fn();
    useRouter.mockReturnValue({ asPath: CURRENT_PATH, push });
    useUser.mockReturnValue({ user: null, isLoading: false, fetchUser: vi.fn() });

    renderWithTheme(
      <Content
        mode="compact"
        content={{ id: 'c1', owner_id: 'u1', owner_username: 'alguem', slug: 'titulo-do-conteudo', parent_id: 'root' }}
        rootContent={{ id: 'root' }}
      />,
    );

    // Primer's Tooltip renders a visually-hidden duplicate alongside the visible button, so both
    // share the accessible name in jsdom (which doesn't apply the stylesheet that hides one of them).
    const [replyButton] = screen.getAllByRole('button', { name: 'Responder' });
    fireEvent.click(replyButton);

    expect(push).toHaveBeenCalledWith(EXPECTED_LOGIN_URL);
  });

  it('Content (edit mode): unauthenticated submit of the publish form', () => {
    const push = vi.fn();
    useRouter.mockReturnValue({ asPath: CURRENT_PATH, push });
    useUser.mockReturnValue({ user: null, isLoading: false, fetchUser: vi.fn() });

    const { container } = renderWithTheme(<Content mode="edit" content={{ title: '', body: '', source_url: '' }} />);

    fireEvent.submit(container.querySelector('form'));

    expect(push).toHaveBeenCalledWith(EXPECTED_LOGIN_URL);
  });

  it('TabCoinButtons: unauthenticated click on a vote button', () => {
    const push = vi.fn();
    useRouter.mockReturnValue({ asPath: CURRENT_PATH, push });
    useUser.mockReturnValue({ user: null, isLoading: false, fetchUser: vi.fn() });

    renderWithTheme(
      <TabCoinButtons
        content={{ id: 'c1', status: 'published', owner_username: 'alguem', slug: 'titulo-do-conteudo', tabcoins: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Creditar TabCoin' }));

    expect(push).toHaveBeenCalledWith(EXPECTED_LOGIN_URL);
  });

  it('Header: the login link href for an unauthenticated visitor', () => {
    useRouter.mockReturnValue({ asPath: CURRENT_PATH, pathname: '/alguem/titulo-do-conteudo' });
    useMediaQuery.mockReturnValue(false);
    useUser.mockReturnValue({ user: null, isLoading: false, logout: vi.fn() });

    renderWithTheme(<Header />);

    expect(screen.getByRole('link', { name: 'Login' })).toHaveProperty(
      'href',
      `http://localhost:3000${EXPECTED_LOGIN_URL}`,
    );
  });
});
