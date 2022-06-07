import useSWR from 'swr';
import { useState, useEffect } from 'react';

async function fetcher(url) {
  const response = await fetch(url);
  const responseBody = await response.json();

  if (response.status === 401 || response.status === 403) {
    const error = new Error(responseBody.message);
    error.status = response.status;
    throw error;
  }

  return responseBody;
}

const userEndpoint = '/api/v1/user';

export default function useUser() {
  const [user, setUser] = useState();

  // Stage 1 = true (always revalidate)
  // Stage 2 = false (revalidate only if user stored in localStorage)
  const [shouldRevalidate, setShouldRevalidate] = useState(true);

  const [loginStatus, setLoginStatus] = useState('loading');

  useEffect(() => {
    const userStored = localStorage.getItem('user');

    if (userStored) {
      setLoginStatus('logged-in');
      setUser(JSON.parse(userStored));
      setShouldRevalidate(true);
    } else {
      setLoginStatus('logged-out');
    }
  }, []);

  const { data, isLoading, isValidating, error } = useSWR(shouldRevalidate ? userEndpoint : false, fetcher, {
    fallbackData: user,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    onSuccess,
    onError,
  });

  function onSuccess(data) {
    localStorage.setItem('user', JSON.stringify(data));
    setLoginStatus('logged-in');
  }

  function onError(error) {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('user');
      setLoginStatus('logged-out');
    }
  }

  return {
    user: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
    loginStatus: loginStatus,
  };
}
