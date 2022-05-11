import useSWR from 'swr';

export default function useUser() {
  const { data, isLoading, isValidating, error } = useSWR('/api/v1/user', {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    user: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
  };
}
