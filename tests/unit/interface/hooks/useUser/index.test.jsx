import { renderHook, waitFor } from '@testing-library/react';

import useUser, { UserProvider } from 'interface/hooks/useUser';

const fetchedUser = { id: 'user-id', username: 'user', features: ['read:session'], tabcoins: 0, tabcash: 0 };

function renderUser() {
  const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

  return result;
}

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'has_session=; max-age=0; path=/';
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json(fetchedUser))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useUser', () => {
  test('Without cached user and without "has_session" cookie', async () => {
    const result = renderUser();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  test('Without cached user, but with "has_session" cookie', async () => {
    document.cookie = 'has_session=1; path=/';

    const result = renderUser();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('/api/v1/user');
    expect(result.current.user).toStrictEqual(fetchedUser);
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ id: 'user-id', username: 'user' });
  });

  test('With cached user and without "has_session" cookie', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user-id', username: 'old-username' }));

    const result = renderUser();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('/api/v1/user');
    expect(result.current.user).toStrictEqual(fetchedUser);
  });

  test('With "has_session" cookie, but expired session', async () => {
    document.cookie = 'has_session=1; path=/';
    fetch.mockResolvedValueOnce(Response.json({ message: 'Usuário não possui sessão ativa.' }, { status: 401 }));

    const result = renderUser();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetch).toHaveBeenCalledWith('/api/v1/user');
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
