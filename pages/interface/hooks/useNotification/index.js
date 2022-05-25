import useSWR from 'swr';

export default function useNotification() {
  const { data, isLoading, isValidating, error } = useSWR('/api/v1/notifications', {
    refreshInterval: 2000
  });

  return {
    notifications: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
  };
}
