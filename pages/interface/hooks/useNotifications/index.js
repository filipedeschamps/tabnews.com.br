import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const notificationsEndpoint = '/api/v1/notifications/web';
const refreshInterval = 300000; // 5 minutes

const NotificationsContext = createContext({
  notifications: null,
  isLoading: true,
  error: undefined,
  getAllNotifications: async () => {},
  readNotification: async () => {},
  readAllNotifications: async () => {},
  deleteAllNotifications: async () => {},
});

export function NotificationsProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(undefined);

  const readAllNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${notificationsEndpoint}/read-all`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json, application/x-ndjson',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        let existingNotifications = JSON.parse(localStorage.getItem('user_notifications'));

        if (!Array.isArray(existingNotifications)) {
          existingNotifications = [];
        }

        const updatedNotifications = existingNotifications.map((notification) => {
          return { ...notification, status: 'read' };
        });

        localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));

        setIsLoading(false);
        return { status: response.status };
      }
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${notificationsEndpoint}/delete-all`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json, application/x-ndjson',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        localStorage.removeItem('user_notifications');
        setIsLoading(false);

        return { status: response.status };
      }
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }, []);

  const readNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`${notificationsEndpoint}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, application/x-ndjson',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        let existingNotifications = JSON.parse(localStorage.getItem('user_notifications'));

        if (!Array.isArray(existingNotifications)) {
          existingNotifications = [];
        }

        const updatedNotifications = existingNotifications.map((notification) => {
          if (notification.id === notificationId) {
            return { ...notification, status: 'read' };
          }
          return notification;
        });

        localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
        setIsLoading(false);

        return { status: response.status };
      }
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }, []);

  const getAllNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${notificationsEndpoint}/all`, {
        method: 'GET',
        headers: {
          Accept: 'application/json, application/x-ndjson',
          'Content-Type': 'application/json',
        },
      });
      const responseBody = await response.json();

      if (response.status === 200) {
        const fetchedNotifications = responseBody;

        const cachedNotificationsProperties = { ...responseBody, cacheTime: Date.now() };

        setNotifications(fetchedNotifications);
        localStorage.setItem('user_notifications', JSON.stringify(cachedNotificationsProperties));
        setIsLoading(false);
      } else if ([401, 403, 404].includes(response.status) && !responseBody?.blocked) {
        setNotifications([]);
        localStorage.setItem('user_notifications', JSON.stringify([]));
        setIsLoading(false);
      } else {
        setIsLoading(false);
        const error = new Error(responseBody.message);
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }, []);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('user_notifications');
    (async () => {
      if (storedNotifications && isLoading) {
        setNotifications(JSON.parse(storedNotifications));
        await getAllNotifications();
      }
      setIsLoading(false);
    })();

    if (isLoading) return;

    function onFocus() {
      const cachedNotifications = JSON.parse(localStorage.getItem('user_notifications'));
      setNotifications((notifications) =>
        cachedNotifications?.notifications ? { ...notifications, ...cachedNotifications } : null,
      );
      if (refreshInterval < Date.now() - cachedNotifications?.cacheTime) setNotifications();
    }
    addEventListener('focus', onFocus);

    return () => removeEventListener('focus', onFocus);
  }, [isLoading, getAllNotifications]);

  const notificationContextValue = {
    notifications,
    isLoading,
    error,
    getAllNotifications,
    readNotification,
    readAllNotifications,
    deleteAllNotifications,
  };

  return <NotificationsContext.Provider value={notificationContextValue}>{children}</NotificationsContext.Provider>;
}

export default function useNotifications() {
  return useContext(NotificationsContext);
}
