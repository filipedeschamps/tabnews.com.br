import { fireEvent, screen, within } from '@testing-library/react';
import { useState } from 'react';

import { NotificationMenu } from './NotificationMenu';
import { NotificationsProvider } from './Provider';
import { createNotificationList, renderWithTheme, resetNotificationCount } from './test-utils';

describe('ui/Notifications/NotificationMenu', () => {
  it('renders the bell icon', () => {
    renderWithTheme(<StatefulNotificationMenu />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  describe('notification count badge', () => {
    it('does not render a badge when no getCount function is provided', () => {
      renderWithTheme(<StatefulNotificationMenu />);
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('does not render a badge when count is 0', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 0} />);
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('renders the count when it is 1', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 1} />);
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');
    });

    it('renders the count when it is 99', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 99} />);
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('99');
    });

    it('renders "99+" when count is 100', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 100} />);
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('99+');
    });

    it('renders "99+" when count is greater than 99', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 120} />);
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('99+');
    });

    it('calls getCount with notifications', () => {
      const notifications = createNotificationList(5);
      const getCount = vi.fn(() => 5);

      renderWithTheme(<StatefulNotificationMenu getCount={getCount} notifications={notifications} />);

      expect(getCount).toHaveBeenCalledWith(notifications);
    });
  });

  describe('aria-label for bell icon', () => {
    it('shows "Notifications" when count is not provided', () => {
      renderWithTheme(<StatefulNotificationMenu />);
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });

    it('shows "No unread notifications" when count is 0', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 0} />);
      expect(screen.getByLabelText('No unread notifications')).toBeInTheDocument();
    });

    it('shows "1 unread notification" when count is 1', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 1} />);
      expect(screen.getByLabelText('1 unread notification')).toBeInTheDocument();
    });

    it('shows "99 unread notifications" when count is 99', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 99} />);
      expect(screen.getByLabelText('99 unread notifications')).toBeInTheDocument();
    });

    it('shows "100 unread notifications" when count is 100', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 100} />);
      expect(screen.getByLabelText('100 unread notifications')).toBeInTheDocument();
    });

    it('shows "5 unread notifications" when count is 5', () => {
      renderWithTheme(<StatefulNotificationMenu getCount={() => 5} />);
      expect(screen.getByLabelText('5 unread notifications')).toBeInTheDocument();
    });

    it('can be customized', () => {
      const customBellLabel = (count) => `You have ${count} new messages`;
      renderWithTheme(<StatefulNotificationMenu getCount={() => 10} labels={{ getBellLabel: customBellLabel }} />);
      expect(screen.getByLabelText('You have 10 new messages')).toBeInTheDocument();
    });
  });

  describe('menu open/close', () => {
    it('opens the menu when bell icon is clicked', () => {
      resetNotificationCount();
      renderWithTheme(<StatefulNotificationMenu notifications={createNotificationList(1)} />);
      const bellButton = screen.getByLabelText('Notifications');

      fireEvent.click(bellButton);
      const dialog = screen.getByRole('dialog');

      expect(within(dialog).getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Body for notification 1')).toBeInTheDocument();
    });

    it('closes the menu when close button is clicked', () => {
      const onCloseMenu = vi.fn();
      renderWithTheme(<StatefulNotificationMenu notifications={createNotificationList(1)} onCloseMenu={onCloseMenu} />);
      const bellButton = screen.getByLabelText('Notifications');
      fireEvent.click(bellButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onCloseMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('menu content', () => {
    it('renders the default header', () => {
      renderWithTheme(<StatefulNotificationMenu />);
      fireEvent.click(screen.getByLabelText('Notifications'));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Notifications')).toBeInTheDocument();
    });

    it('renders a custom topBar in the menu header next to the close button', () => {
      const topBar = <div data-testid="custom-header">My Notifications</div>;
      renderWithTheme(<StatefulNotificationMenu menuProps={{ topBar }} />);
      fireEvent.click(screen.getByLabelText('Notifications'));
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.getByText('My Notifications')).toBeInTheDocument();
    });

    it('renders a sectionIntro', () => {
      const sectionIntro = <div data-testid="custom-section-intro">Introduction to Notifications</div>;
      renderWithTheme(<StatefulNotificationMenu menuProps={{ sectionIntro }} />);
      fireEvent.click(screen.getByLabelText('Notifications'));
      expect(screen.getByTestId('custom-section-intro')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Notifications')).toBeInTheDocument();
    });

    it('renders the notification list', () => {
      const notifications = createNotificationList(3);
      renderWithTheme(<StatefulNotificationMenu notifications={notifications} />);
      fireEvent.click(screen.getByLabelText('Notifications'));
      notifications.forEach((n) => {
        expect(screen.getByText(n.body)).toBeInTheDocument();
      });
    });
  });

  describe('custom props', () => {
    it('applies custom buttonProps to the bell icon button', () => {
      renderWithTheme(<StatefulNotificationMenu menuProps={{ buttonProps: { 'data-testid': 'custom-button' } }} />);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('applies custom overlayProps to the overlay', () => {
      renderWithTheme(<StatefulNotificationMenu menuProps={{ overlayProps: { 'data-testid': 'custom-overlay' } }} />);
      expect(screen.queryByTestId('custom-overlay')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Notifications'));
      expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
    });
  });
});

function StatefulNotificationMenu({ menuProps, ...ctx }) {
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <NotificationsProvider isMenuOpen={isMenuOpen} setMenuOpen={setMenuOpen} {...ctx}>
      <NotificationMenu {...menuProps} />
    </NotificationsProvider>
  );
}
