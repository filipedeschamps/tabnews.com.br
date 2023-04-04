import webserver from 'infra/webserver';
import { useRouter } from 'next/router';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const userEndpoint = '/api/v1/user';
const sessionEndpoint = '/api/v1/sessions';
const protectedRoutes = ['/login', '/cadastro', '/cadastro/recuperar'];
const refreshInterval = 600000; // 10 minutes

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(undefined);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(userEndpoint);
      const responseBody = await response.json();

      if (response.status === 200) {
        const fetchedUser = responseBody;

        const cachedUserProperties = {
          id: responseBody.id,
          username: responseBody.username,
          features: responseBody.features,
          tabcoins: responseBody.tabcoins,
          tabcash: responseBody.tabcash,
          cacheTime: Date.now(),
        };

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(cachedUserProperties));
        localStorage.removeItem('reloadTime');
      }

      if (response.status >= 400) {
        const error = new Error(responseBody.message);
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      setError(error);
      if (
        error.status === undefined ||
        (error.status === 403 && webserver.isProduction && !response?.headers.get('x-vercel-id'))
      ) {
        // If is proxy error, then go to login page and reload if is already there
        if (localStorage.getItem('reloadTime') > Date.now() - 30000) return;
        if (protectedRoutes.includes(router.pathname)) {
          localStorage.setItem('reloadTime', Date.now());
          router.reload();
        } else {
          setUser((user) => (user?.id ? { ...user, proxyResponse: true } : null));
          await router.push(`/login?redirect=${router.asPath}`);
        }
      } else if (error.status === 401 || error.status === 403) {
        setUser(null);
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    (async () => {
      if (storedUser && isLoading && !isFetching) {
        setUser(JSON.parse(storedUser));
        setIsFetching(true);
        await fetchUser();
        setIsFetching(false);
      }
      setIsLoading(false);
    })();

    if (isLoading) return;

    function onFocus() {
      const cachedUser = JSON.parse(localStorage.getItem('user'));
      setUser((user) => (cachedUser?.username ? { ...user, ...cachedUser } : null));
      if (refreshInterval < Date.now() - cachedUser?.cacheTime) fetchUser();
    }
    addEventListener('focus', onFocus);

    return () => removeEventListener('focus', onFocus);
  }, [fetchUser, isFetching, isLoading]);

  useEffect(() => {
    if (!router || !protectedRoutes.includes(router.pathname)) return;

    (async () => {
      if (user?.proxyResponse || !user?.id) await fetchUser();

      if (!user?.id || router.pathname !== '/login') return;

      if (router.query?.redirect?.startsWith('/')) {
        router.replace(router.query.redirect);
      } else {
        router.replace('/');
      }
    })();
  }, [user, router, fetchUser]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(sessionEndpoint, {
        method: 'DELETE',
      });

      if (response.status === 200) {
        localStorage.clear();
        setUser(null);
      }
    } catch (error) {
      setError(error);
    }
  }, []);

  const userContextValue = {
    user,
    isLoading,
    error,
    fetchUser,
    logout,
  };

  return <UserContext.Provider value={userContextValue}>{children}</UserContext.Provider>;
}

export default function useUser() {
  return useContext(UserContext);
}
