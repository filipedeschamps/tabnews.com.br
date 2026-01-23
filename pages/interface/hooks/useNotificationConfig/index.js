import { CheckIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CommentIcon } from '@/TabNewsUI/icons';

const basePath = '/notifications';

// Function to fetch your notifications (e.g., from an API)
async function getNotificationsFromAPI(options) {
  let path = `/api/v1/notifications?page=${options.page || 1}&per_page=${options.per_page || 10}`;
  if (options.read !== undefined) {
    path += `&read=${options.read}`;
  }
  const response = await fetch(path);
  return await response.json();
}

async function markAsReadAPI(notificationId, read = true) {
  await fetch(`/api/v1/notifications/${notificationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ read: read }),
  });
}

async function markAllAsReadAPI() {
  await fetch(`/api/v1/notifications`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      unread_until: new Date(),
    }),
  });
}

function buildMessage(notification, user) {
  const {
    content_owner,
    parent_title,
    parent_owner_id,
    root_content_owner_id,
    root_content_owner,
    root_content_title,
  } = notification.metadata || {};
  const type = notification?.type;
  if (type == 'content:created') {
    // Comentário em publicação do usuário
    if (!parent_title && parent_owner_id === user.id) {
      if (user.id !== root_content_owner_id) {
        return `${content_owner} respondeu seu comentário na publicação "${root_content_title}" de ${root_content_owner}.`;
      }
      return `${content_owner} respondeu seu comentário na sua publicação "${root_content_title}".`;
    }

    // Comentário em comentário do usuário
    if (parent_title && parent_owner_id === user.id) {
      if (user.id === root_content_owner_id) {
        return `${content_owner} respondeu sua publicação "${root_content_title}".`;
      }
      return `${content_owner} respondeu a publicação "${root_content_title}" de ${root_content_owner}.`;
    }

    // Fallback para outros casos
    return `${content_owner} comentou na publicação "${root_content_title}".`;
  }
  // Fallback
  return 'Você recebeu uma nova notificação.';
}

export default function useNotificationConfig({ user, options = {} }) {
  const showPagination = options?.is_page || false;
  const [notifications, setNotifications] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: options.page || 1,
    lastPage: null,
    previousPage: null,
    nextPage: null,
    perPage: options.per_page || 100,
    basePath: basePath,
    totalItems: null,
  });
  const router = useRouter();

  async function fetchNotifications(user, options = {}) {
    setIsLoading(true);
    if (!options.is_page) {
      options.read = false;
    }
    const { pagination, rows: notifications } = (await getNotificationsFromAPI(options)) || [];

    setPagination({
      currentPage: pagination.currentPage,
      lastPage: pagination.lastPage,
      previousPage: pagination.previousPage,
      nextPage: pagination.nextPage,
      perPage: pagination.perPage,
      basePath: basePath,
      totalItems: pagination.totalRows,
    });

    setNotifications(
      notifications.map((n) => ({
        ...n,
        url: `/${n.metadata?.content_owner ?? n.metadata?.root_content_owner}/${n.metadata?.content_slug ?? n.metadata?.root_content_slug}`,
        title: n.metadata?.content_title ?? n.metadata?.root_content_title,
        body: buildMessage(n, user),
      })),
    );
    setIsLoading(false);
  }

  // Fetch initial notifications
  useEffect(() => {
    if (!user) {
      return;
    }
    fetchNotifications(user, options);
  }, [user, options]);

  // Action executed when an item is selected
  const onItemSelect = async (notification) => {
    // Mark as read locally
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    // Mark as read in the API
    setIsLoading(true);
    await markAsReadAPI(notification.id, !notification.read);
    fetchNotifications(user, options);
    setIsLoading(false);

    // Close the menu and navigate
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const onMarkAllAsRead = async () => {
    setIsLoading(true);
    await markAllAsReadAPI();
    await fetchNotifications(user, options);
    setIsLoading(false);
  };

  // Define the actions available for each notification
  const actions = [
    {
      getLabel: (item) => (item.read ? 'Marcar como não lida' : 'Marcar como lida'),
      icon: CheckIcon,
      onClick: async (item) => {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
        setIsLoading(true);
        await markAsReadAPI(item.id, !item.read);
        await fetchNotifications(user, options);
        setIsLoading(false);
      },
    },
    // {
    //   label: 'Dismiss',
    //   icon: TrashIcon,
    //   onClick: (item) => {
    //     setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    //   },
    // },
  ];

  return {
    // State and Logic
    notifications,
    isLoading,
    isMenuOpen,
    setMenuOpen: setIsMenuOpen,
    onItemSelect,
    actions,
    onMarkAllAsRead,
    // Functions to customize the UI
    isItemRead: (item) => item.read,
    getCount: (items) => pagination.totalItems || items.filter((n) => !n.read).length,
    getItemIcon: (_) => {
      // Return an icon based on the notification type
      // ex: return <CommentIcon />;
      return <CommentIcon />;
    },
    pagination,
    setPagination,
    showPagination,
  };
}
