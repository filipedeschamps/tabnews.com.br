import useSWR from 'swr';

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
  const { data, isLoading, isValidating, error } = useSWR(userEndpoint, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    onSuccess,
    onError,
  });

  function onSuccess(data) {
    localStorage.setItem('user', JSON.stringify(data));
  }

  function onError(error) {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('user');
    }
  }

  return {
    user: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
  };
}
