import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const bookmarksEndpoint = '/api/v1/bookmarks';
const refreshInterval = 600000; // 10 minutes

const BookmarksContext = createContext();

export function BookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(undefined);

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await fetch(bookmarksEndpoint);
      const responseBody = await response.json();

      if (response.status !== 401 && response.status !== 403) {
        const fetchedBookmarks = responseBody;

        const cachedBookmarksPropertis = {
          bookmarks: responseBody.bookmarks,
          cacheTime: Date.now(),
        };

        setBookmarks(fetchedBookmarks);
        localStorage.setItem('bookmarks', JSON.stringify(cachedBookmarksPropertis));
      } else {
        setBookmarks([]);
        localStorage.removeItem('bookmarks');
        const error = new Error(responseBody.message);
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      setError(error);
    }
  }, []);

  useEffect(() => {
    const storeBookmarks = localStorage.getItem('bookmarks');

    (async () => {
      if (storeBookmarks) {
        setBookmarks(JSON.parse(storeBookmarks));
        await fetchBookmarks();
      }
      setIsLoading(false);
    })();
  }, [fetchBookmarks]);

  useEffect(() => {
    if (isLoading) return;

    function onFocus() {
      const cachedBookmarks = JSON.parse(localStorage.getItem('bookmarks'));
      setBookmarks((bookmakrs) => (cachedBookmarks?.username ? { ...bookmakrs, ...cachedBookmarks } : null));
      if (refreshInterval < Date.now() - cachedBookmarks?.cacheTime) fetchBookmarks();
    }
    addEventListener('focus', onFocus);

    return () => removeEventListener('focus', onFocus);
  }, [fetchBookmarks, isLoading]);

  const BookmarksContextValue = {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
  };

  return <BookmarksContext.Provider value={BookmarksContextValue}>{children}</BookmarksContext.Provider>;
}

export default function useBookmarks() {
  return useContext(BookmarksContext);
}
