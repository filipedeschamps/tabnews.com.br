import { renderHook } from '@testing-library/react';

import { NotificationsProvider, useNotifications } from '.';
import { createNotificationList } from './test-utils';

describe('ui/Notifications', () => {
  describe('useNotifications', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('throws an error when used outside of NotificationsProvider', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useNotifications())).toThrow(
        'useNotifications must be used within a NotificationsProvider',
      );
    });

    it('returns the context value when used inside NotificationsProvider', () => {
      const mockNotifications = createNotificationList(1);
      const mockLabels = { empty: 'No items' };
      const mockGetCount = vi.fn(() => 1);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => (
          <NotificationsProvider notifications={mockNotifications} labels={mockLabels} getCount={mockGetCount}>
            {children}
          </NotificationsProvider>
        ),
      });

      expect(result.current.notifications).toStrictEqual(mockNotifications);
      expect(result.current.labels).toStrictEqual(expect.objectContaining(mockLabels));
      expect(result.current.getCount).toBe(mockGetCount);

      expect(result.current.getCount(mockNotifications)).toBe(1);
      expect(mockGetCount).toHaveBeenCalledWith(mockNotifications);
    });

    it('provides default values when not explicitly overridden', () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => <NotificationsProvider>{children}</NotificationsProvider>,
      });

      expect(result.current.labels.empty).toBe('No notifications available');
      expect(result.current.labels.notifications).toBe('Notifications');
      expect(result.current.getCount).toBeUndefined();
    });
  });
});
