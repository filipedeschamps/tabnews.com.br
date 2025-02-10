import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const userEndpoint = '/api/v1/user';
const sessionEndpoint = '/api/v1/sessions';
const refreshInterval = 600000; // 10 minutes

const UserContext = createContext({
  user: null,
  isLoading: true,
  error: undefined,
  fetchUser: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(undefined);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(userEndpoint);
      const responseBody = await response.json();

      if (response.status === 200) {
        const fetchedUser = responseBody;

        const cachedUserProperties = {
          id: responseBody.id,
          username: responseBody.username,
          description: responseBody.description,
          features: responseBody.features,
          tabcoins: responseBody.tabcoins,
          tabcash: responseBody.tabcash,
          cacheTime: Date.now(),
        };

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(cachedUserProperties));
      } else if ([401, 403].includes(response.status) && !responseBody?.blocked) {
        setUser(null);
        localStorage.removeItem('user');
      } else {
        const error = new Error(responseBody.message);
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      setError(error);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    (async () => {
      if (storedUser && isLoading) {
        setUser(JSON.parse(storedUser));
        await fetchUser();
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
  }, [fetchUser, isLoading]);

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
