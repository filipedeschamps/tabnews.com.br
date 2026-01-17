import { useEffect, useRef, useState } from 'react';

import { Box, Button, NavItem, NavList, PrimerHeader, Spinner, Tooltip } from '@/TabNewsUI';
import { BellIcon, CommentDiscussionIcon } from '@/TabNewsUI/icons';

const notificationIcons = {
  reply: {
    icon: CommentDiscussionIcon,
    color: 'accent.fg',
  },
  default: {
    icon: BellIcon,
    color: 'fg.muted',
  },
};

function NotificationsMenu({ user, usePolling = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifyCount, setUnreadNotifyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useNotificationsPolling(user, setUnreadNotifyCount, setNotifications, usePolling);

  async function onOpen() {
    setIsOpen(true);
    setIsLoading(true);
    await fetchNotifications(setUnreadNotifyCount, setNotifications);
    setIsLoading(false);
  }

  const buttonStyles = {
    p: 0,
    m: 0,
    color: 'header.logo',
    '&:hover': {
      color: 'header.text',
      backgroundColor: 'transparent',
    },
  };

  const containerStyles = {
    position: 'absolute',
    top: '60px',
    right: '20px',
    width: '320px',
    bg: 'canvas.overlay',
    borderRadius: 2,
    boxShadow: 'overlay',
    zIndex: 1000,
    p: 2,
  };

  function renderContent() {
    const hasUnread = notifications.some((n) => !n.is_read);
    if (isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3,
            color: 'fg.default',
          }}>
          <Spinner size="medium" />
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box
          sx={{
            color: 'fg.default',
            textAlign: 'center',
            py: 3,
            fontSize: 1,
          }}>
          Nenhuma notificação.
        </Box>
      );
    }

    return (
      <>
        {hasUnread && (
          <Button
            variant="invisible"
            sx={{
              fontSize: 0,
              color: 'fg.muted',
              mb: 1,
              px: 1,
              py: 0,
              alignSelf: 'flex-end',
              '&:hover': { color: 'accent.fg', bg: 'transparent' },
            }}
            onClick={() => handleMarkAllAsRead(setNotifications, setUnreadNotifyCount)}>
            Marcar todas como lidas
          </Button>
        )}
        <NavList>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => handleReadNotification(notification, setNotifications, setUnreadNotifyCount)}
            />
          ))}
        </NavList>
      </>
    );
  }

  const notificationRef = useRef(null);
  const buttonRef = useRef(null);

  OnClickOutsideNotification(notificationRef, buttonRef, () => setIsOpen(false), isOpen);

  return (
    <PrimerHeader.Item sx={{ m: 2 }}>
      <Tooltip text="Notificações">
        <Button
          ref={buttonRef}
          aria-label="Abrir notificações"
          variant="invisible"
          sx={buttonStyles}
          onClick={isOpen ? () => setIsOpen(false) : onOpen}>
          <BellIcon />
          {unreadNotifyCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                bg: 'danger.fg',
                color: 'canvas.default',
                borderRadius: '50%',
                fontSize: 0,
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}>
              {unreadNotifyCount > 99 ? '99+' : unreadNotifyCount}
            </Box>
          )}
        </Button>
      </Tooltip>

      {isOpen && (
        <Box ref={notificationRef} sx={containerStyles}>
          {renderContent()}

          <Button variant="invisible" sx={{ mt: 2, width: '100%' }} onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </Box>
      )}
    </PrimerHeader.Item>
  );
}

function useNotificationsPolling(user, setUnreadNotifyCount, setNotifications, usePolling) {
  useEffect(() => {
    if (!user || !usePolling) return;

    fetchNotifications(setUnreadNotifyCount, setNotifications); // Busca inicial

    const interval = setInterval(() => fetchNotifications(setUnreadNotifyCount, setNotifications), 15 * 60 * 1000); // 15 minutos

    return () => clearInterval(interval);
  }, [user, setUnreadNotifyCount, setNotifications, usePolling]);
}

function NotificationItem({ notification, onRead }) {
  const { message, is_read, content_link, created_at } = notification;

  const { icon: Icon, color } = notificationIcons[notification.type] || notificationIcons.default;

  return (
    <NavItem
      href={content_link || '#'}
      onClick={onRead}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        px: 3,
        py: 2,
        borderRadius: 2,
        color: 'fg.default',
        opacity: is_read ? 0.65 : 1,
        bg: 'transparent',
        fontWeight: 'normal',
        '&:hover': {
          bg: 'canvas.muted',
        },
      }}>
      {/* Ícone */}
      <Box
        sx={{
          mt: '2px',
          color,
          flexShrink: 0,
        }}>
        <Icon size={16} />
      </Box>

      {/* Texto */}
      <Box sx={{ fontSize: 1, lineHeight: '20px' }}>{message}</Box>

      {/* Tempo */}
      <Box
        sx={{
          // position: 'absolute',
          // top: 2,
          right: 2,
          fontSize: 0,
          color: 'fg.muted',
          whiteSpace: 'nowrap',
        }}>
        {formatTimeAgo(created_at)}
      </Box>

      {/* Indicador de não lida */}
      {!is_read && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bg: 'accent.fg',
            ml: 'auto',
            mt: '6px',
          }}
        />
      )}
    </NavItem>
  );
}

async function handleMarkAllAsRead(setNotifications, setUnreadNotifyCount) {
  try {
    await fetch('/api/v1/notifications/mark-all-read', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    setUnreadNotifyCount(0);
  } catch {
    console.error('Erro ao marcar todas como lidas.');
  }
}

async function handleReadNotification(notification, setNotifications, setUnreadNotifyCount) {
  if (notification.is_read) return;

  // Atualização otimista
  setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));

  setUnreadNotifyCount((prev) => Math.max(prev - 1, 0));

  try {
    await fetch(`/api/v1/notifications/${notification.id}/read`, {
      method: 'PATCH',
    });
    await fetchNotifications(setUnreadNotifyCount, setNotifications);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida.', error);
  }
}

function OnClickOutsideNotification(notificationRef, buttonRef, onClose, isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef, buttonRef, onClose, isOpen]);
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return `há ${diffSeconds}s`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `há ${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays == 1) return `há 1 dia`;
  if (diffDays <= 90) {
    return `há ${diffDays} dias`;
  }

  return `há 90+ dias`;
}

async function fetchNotifications(setUnreadNotifyCount, setNotifications) {
  try {
    const res = await fetch('/api/v1/notifications');
    const data = await res.json();
    const unreadCount = data.unreadCount || 0;
    setUnreadNotifyCount(unreadCount);
    setNotifications(data.notifications);
  } catch {
    setUnreadNotifyCount(0);
    setNotifications([]);
  }
}

export default function useBellNotification() {
  return {
    NotificationsMenu,
  };
}

export { formatTimeAgo, useNotificationsPolling, OnClickOutsideNotification }; // Only for testing
