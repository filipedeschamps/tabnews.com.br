import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useBellNotification, {
  formatTimeAgo,
  OnClickOutsideNotification,
  useNotificationsPolling,
} from '@/BellNotification';

// Mocks
vi.mock('@/TabNewsUI/icons', () => ({
  BellIcon: () => <div data-testid="bell-icon" />,
  CommentDiscussionIcon: () => <div data-testid="comment-icon" />,
}));
vi.mock('@/TabNewsUI', () => ({
  Spinner: (props) => <div data-testid="spinner" {...props} />,
  Box: (props) => <div data-testid="box" {...props} />,
  Button: (props) => <button {...props}>{props.children}</button>,
  PrimerHeader: { Item: (props) => <div data-testid="header-item" {...props} /> },
  NavList: (props) => <ul {...props}>{props.children}</ul>,
  NavItem: (props) => <li {...props}>{props.children}</li>,
  Tooltip: (props) => <div data-testid="tooltip" {...props} />,
}));

vi.spyOn(globalThis, 'fetch').mockImplementation();

describe('BellNotification', () => {
  let NotificationsMenu;
  beforeEach(() => {
    NotificationsMenu = useBellNotification().NotificationsMenu;
    vi.clearAllMocks();
  });

  it('renders bell icon and opens menu', () => {
    fetch.mockResolvedValueOnce({
      json: () => ({ unreadCount: 1, notifications: [] }),
    });
    const { getByLabelText, getByTestId } = render(<NotificationsMenu user={{ id: 1 }} usePolling={false} />);
    const button = getByLabelText('Abrir notificações');
    expect(getByTestId('bell-icon')).toBeTruthy();
    act(() => {
      fireEvent.click(button);
    });
    expect(fetch).toHaveBeenCalled();
  });

  it('shows loading spinner when loading', async () => {
    let resolveFetch;
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              json: () => ({ unreadCount: 0, notifications: [] }),
            });
        }),
    );
    const { getByLabelText, findByTestId } = render(<NotificationsMenu user={{ id: 1 }} usePolling={false} />);
    act(() => {
      fireEvent.click(getByLabelText('Abrir notificações'));
    });
    // O spinner deve aparecer enquanto o fetch não resolve
    expect(await findByTestId('spinner')).toBeTruthy();
    // Agora resolva o fetch para liberar o teste
    act(() => {
      resolveFetch();
    });
  });

  it('shows empty state when no notifications', async () => {
    fetch.mockResolvedValueOnce({
      json: () => ({ unreadCount: 0, notifications: [] }),
    });
    const { getByLabelText, findByText } = render(<NotificationsMenu user={{ id: 1 }} usePolling={false} />);
    act(() => {
      fireEvent.click(getByLabelText('Abrir notificações'));
    });
    expect(await findByText('Nenhuma notificação.')).toBeTruthy();
  });

  it('shows notifications and mark all as read', async () => {
    fetch.mockResolvedValueOnce({
      json: () => ({
        unreadCount: 2,
        notifications: [
          {
            id: 1,
            is_read: false,
            message: 'msg',
            type: 'reply',
            content_link: '',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            is_read: false,
            message: 'msg2',
            type: 'default',
            content_link: '',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    fetch.mockResolvedValueOnce({
      json: () => ({
        unreadCount: 0,
        notifications: [
          {
            id: 1,
            is_read: true,
            message: 'msg',
            type: 'reply',
            content_link: '',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            is_read: true,
            message: 'msg2',
            type: 'default',
            content_link: '',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    const { getByLabelText, findByText, getByText } = render(<NotificationsMenu user={{ id: 1 }} usePolling={false} />);
    act(() => {
      fireEvent.click(getByLabelText('Abrir notificações'));
    });
    expect(await findByText('Marcar todas como lidas')).toBeTruthy();
    act(() => {
      fireEvent.click(getByText('Marcar todas como lidas'));
    });
    expect(fetch).toHaveBeenCalled();
  });

  it('marks notification as read on click', async () => {
    fetch.mockResolvedValueOnce({
      json: () => ({
        unreadCount: 1,
        notifications: [
          {
            id: 1,
            is_read: false,
            message: 'msg',
            type: 'reply',
            content_link: '',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    fetch.mockResolvedValueOnce({
      json: () => ({
        unreadCount: 0,
        notifications: [
          {
            id: 1,
            is_read: true,
            message: 'msg',
            type: 'reply',
            content_link: '',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    fetch.mockResolvedValueOnce({
      json: () => ({
        unreadCount: 0,
        notifications: [
          {
            id: 1,
            is_read: true,
            message: 'msg',
            type: 'reply',
            content_link: '',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
    const { getByLabelText, findByText } = render(<NotificationsMenu user={{ id: 1 }} usePolling={false} />);
    act(() => {
      fireEvent.click(getByLabelText('Abrir notificações'));
    });
    const notification = await findByText('msg');
    act(() => {
      fireEvent.click(notification);
    });
    expect(fetch).toHaveBeenCalled();
  });

  it('formatTimeAgo returns correct values', () => {
    const now = new Date();
    expect(formatTimeAgo(now.toISOString())).toMatch(/há 0s/);
    expect(formatTimeAgo(new Date(now - 1000 * 60).toISOString())).toMatch(/há 1m/);
    expect(formatTimeAgo(new Date(now - 1000 * 60 * 60).toISOString())).toMatch(/há 1h/);
    expect(formatTimeAgo(new Date(now - 1000 * 60 * 60 * 24).toISOString())).toMatch(/há 1 dia/);
    expect(formatTimeAgo(new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString())).toMatch(/há 10 dias/);
    expect(formatTimeAgo(new Date(now - 1000 * 60 * 60 * 24 * 100).toISOString())).toMatch(/há 90\+ dias/);
  });

  it('calls onClose when clicking outside (OnClickOutsideNotification)', () => {
    const notificationRef = { current: document.createElement('div') };
    const buttonRef = { current: document.createElement('button') };
    document.body.appendChild(notificationRef.current);
    document.body.appendChild(buttonRef.current);
    const onClose = vi.fn();
    // Mount hook
    function TestComponent() {
      OnClickOutsideNotification(notificationRef, buttonRef, onClose, true);
      return null;
    }
    render(<TestComponent />);
    // Click inside notificationRef (should NOT close)
    const eventInside = new MouseEvent('mousedown', { bubbles: true });
    notificationRef.current.dispatchEvent(eventInside);
    expect(onClose).not.toHaveBeenCalled();
    // Click inside buttonRef (should NOT close)
    const eventButton = new MouseEvent('mousedown', { bubbles: true });
    buttonRef.current.dispatchEvent(eventButton);
    expect(onClose).not.toHaveBeenCalled();
    // Click outside (should close)
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const eventOutside = new MouseEvent('mousedown', { bubbles: true });
    outside.dispatchEvent(eventOutside);
    expect(onClose).toHaveBeenCalled();
    // Cleanup
    document.body.removeChild(notificationRef.current);
    document.body.removeChild(buttonRef.current);
    document.body.removeChild(outside);
  });

  describe('useNotificationsPolling', () => {
    it('does not configure polling if there is no user', () => {
      const setUnreadNotifyCount = vi.fn();
      const setNotifications = vi.fn();
      function TestComponent() {
        useNotificationsPolling(undefined, setUnreadNotifyCount, setNotifications, true);
        return null;
      }
      render(<TestComponent />);
      expect(setUnreadNotifyCount).not.toHaveBeenCalled();
      expect(setNotifications).not.toHaveBeenCalled();
    });

    it('does not configure polling if usePolling is false', () => {
      const setUnreadNotifyCount = vi.fn();
      const setNotifications = vi.fn();
      function TestComponent() {
        useNotificationsPolling({ id: 1 }, setUnreadNotifyCount, setNotifications, false);
        return null;
      }
      render(<TestComponent />);
      expect(setUnreadNotifyCount).not.toHaveBeenCalled();
      expect(setNotifications).not.toHaveBeenCalled();
    });

    it('configure polling if user and usePolling are true', () => {
      vi.useFakeTimers();
      const setUnreadNotifyCount = vi.fn();
      const setNotifications = vi.fn();
      vi.spyOn(globalThis, 'fetch')
        .mockImplementation()
        .mockResolvedValue({ json: () => ({ unreadCount: 1, notifications: [] }) });
      function TestComponent() {
        useNotificationsPolling({ id: 1 }, setUnreadNotifyCount, setNotifications, true);
        return null;
      }
      render(<TestComponent />);
      // Avança o timer para simular polling
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });
      expect(globalThis.fetch).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
