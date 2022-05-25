import useSWR from 'swr';

export default function useContent({ id, revalidateOnFocus, revalidateOnReconnect, refreshInterval }) {
  const { data, isLoading, isValidating, error, mutate } = useSWR(`/api/v1/contents${id && `?id=${id}`}`, {
    revalidateOnFocus,
    revalidateOnReconnect,
    refreshInterval,
  });

  return {
    content: data,
    isLoading: isLoading,
    isValidating: isValidating,
    error: error,
    mutate: mutate,
  };
}
