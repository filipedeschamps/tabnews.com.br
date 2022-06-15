import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const userEndpoint = '/api/v1/user';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(undefined);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(userEndpoint);
      const responseBody = await response.json();

      if (response.status !== 401 && response.status !== 403) {
        const fetchedUser = {
          id: responseBody.id,
          username: responseBody.username,
          features: responseBody.features,
        };
        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
      } else {
        setUser(null);
        localStorage.removeItem('user');
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
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        await fetchUser();
      }
      setIsLoading(false);
    })();
  }, [fetchUser]);

  const userContextValue = {
    user,
    isLoading,
    error,
    fetchUser,
  };

  return <UserContext.Provider value={userContextValue}>{children}</UserContext.Provider>;
}

export default function useUser() {
  return useContext(UserContext);
}
