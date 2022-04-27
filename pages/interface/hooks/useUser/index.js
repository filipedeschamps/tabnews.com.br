import useSWR from 'swr';

export default function useSession() {
  const { data, isLoading, isValidating, error } = useSWR('/api/v1/user');

  return {
    user: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
  };
}
