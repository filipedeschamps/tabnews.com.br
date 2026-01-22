import { act, fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { NotificationList } from '.';
import { getConfig } from './config';
import { focusSiblingIfRemoved } from './NotificationList';
import {
  createMockAction,
  createMockNotification,
  createNotificationList,
  renderWithContext,
  resetNotificationCount,
} from './test-utils';

describe('ui/Notifications', () => {
  describe('NotificationList', () => {
    it('renders the list of notifications', () => {
      const notifications = createNotificationList(3);

      renderWithContext(<NotificationList />, { notifications });

      notifications.forEach((n) => {
        expect(screen.getByText(`Body for notification ${n.id.split('-')[1]}`)).toBeInTheDocument();
      });
    });

    describe('getItemIcon', () => {
      it('renders notification icon', () => {
        const notifications = createNotificationList(1);
        const getItemIcon = () => <span data-testid="mock-icon">📣</span>;

        renderWithContext(<NotificationList />, { notifications, getItemIcon });

        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      });

      it('renders custom icon for each notification', () => {
        const notifications = createNotificationList(3);
        const getItemIcon = vi.fn((item) => <span data-testid={`icon-${item.id}`}>🔔</span>);

        renderWithContext(<NotificationList />, { notifications, getItemIcon });

        notifications.forEach((item, i) => {
          expect(screen.getByTestId(`icon-${item.id}`)).toBeInTheDocument();
          expect(getItemIcon).toHaveBeenNthCalledWith(i + 1, item);
        });
      });

      test.each([null, undefined])('handles returning %s', (iconResult) => {
        const notifications = createNotificationList(1, {
          title: 'Title',
          body: 'This notification has no icon',
        });

        const getItemIcon = () => iconResult;

        expect(() => renderWithContext(<NotificationList />, { notifications, getItemIcon })).not.toThrow();

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('This notification has no icon')).toBeInTheDocument();
      });
    });

    describe('read state styling', () => {
      const readColor = 'var(--fgColor-disabled)';
      const unreadColor = 'var(--fgColor-default)';

      it('applies read style when isItemRead returns true', () => {
        const notifications = createNotificationList(1);
        const isItemRead = () => true;

        const { getByText } = renderWithContext(<NotificationList />, { notifications, isItemRead });

        const item = getByText(/Notification/);
        const computedColor = getComputedStyle(item).color;

        expect(computedColor).toBe(readColor);
      });

      it('applies unread style when isItemRead returns false', () => {
        const notifications = createNotificationList(1);
        const isItemRead = () => false;

        const { getByText } = renderWithContext(<NotificationList />, { notifications, isItemRead });

        const item = getByText(/Notification/);
        const computedColor = getComputedStyle(item).color;

        expect(computedColor).toBe(unreadColor);
      });

      it('applies default color when isItemRead is not provided', () => {
        const notifications = createNotificationList(1);

        const { getByText } = renderWithContext(<NotificationList />, { notifications });

        const item = getByText(/Notification/);
        const computedColor = getComputedStyle(item).color;

        expect(computedColor).toBe(unreadColor);
      });

      it('applies read style when isItemRead returns different values for each notification', () => {
        resetNotificationCount();
        const notifications = createNotificationList(3);
        const isItemRead = vi.fn((item) => item.id === notifications[0].id);

        const { getByText } = renderWithContext(<NotificationList />, { notifications, isItemRead });

        const readItem = getByText(/Notification 1/);
        const unreadItem = getByText(/Notification 2/);
        const anotherUnreadItem = getByText(/Notification 3/);

        expect(getComputedStyle(readItem).color).toBe(readColor);
        expect(getComputedStyle(unreadItem).color).toBe(unreadColor);
        expect(getComputedStyle(anotherUnreadItem).color).toBe(unreadColor);
        expect(isItemRead).toHaveBeenCalledTimes(3);

        notifications.forEach((notification, i) => {
          expect(isItemRead).toHaveBeenNthCalledWith(i + 1, notification);
        });
      });
    });

    describe('loading and empty states', () => {
      it('renders empty state message when no notifications and not loading', () => {
        renderWithContext(<NotificationList />, {
          notifications: [],
          isLoading: false,
          labels: {
            empty: 'Whoops! No notifications here',
            loading: 'Fetching notifications...',
          },
        });

        expect(screen.getByText('Whoops! No notifications here')).toBeInTheDocument();
        expect(screen.queryByText('Fetching notifications...')).not.toBeInTheDocument();
      });

      it('renders loading state when isLoading is true', () => {
        renderWithContext(<NotificationList />, {
          notifications: [],
          isLoading: true,
          labels: {
            empty: 'No notifications',
            loading: 'Loading notifications...',
          },
        });

        expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
        expect(screen.queryByText('No notifications')).not.toBeInTheDocument();
      });
    });

    describe('onItemSelect', () => {
      it('calls onItemSelect when the item is clicked', () => {
        const notifications = createNotificationList(1);
        const onItemSelect = vi.fn();

        renderWithContext(<NotificationList />, { notifications, onItemSelect });

        fireEvent.click(screen.getByText(/Notification/));

        expect(onItemSelect).toHaveBeenCalledWith(notifications[0]);
      });

      it('calls onItemSelect with keyboard interaction', () => {
        const notifications = createNotificationList(1);
        const onItemSelect = vi.fn();
        renderWithContext(<NotificationList />, { notifications, onItemSelect });
        const item = screen.getByText(/Notification/);

        fireEvent.keyPress(item, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(onItemSelect).toHaveBeenCalledWith(notifications[0]);
        expect(onItemSelect).toHaveBeenCalledTimes(1);

        fireEvent.keyPress(item, { key: 'Escape', code: 'Escape', charCode: 27 });
        expect(onItemSelect).toHaveBeenCalledTimes(1); // Escape should not trigger onItemSelect

        fireEvent.keyPress(item, { key: ' ', code: 'Space', charCode: 32 });
        expect(onItemSelect).toHaveBeenCalledWith(notifications[0]);
        expect(onItemSelect).toHaveBeenCalledTimes(2);
      });

      it('calls onItemSelect with the correct item', () => {
        const notifications = createNotificationList(3);
        const onItemSelect = vi.fn();
        renderWithContext(<NotificationList />, { notifications, onItemSelect });
        const itemToClick = notifications[1];

        fireEvent.click(screen.getByText(`Notification ${itemToClick.id.split('-')[1]}`));

        expect(onItemSelect).toHaveBeenCalledWith(itemToClick);
      });

      it('does not call onItemSelect when action is clicked', () => {
        const notifications = createNotificationList(1);
        const onItemSelect = vi.fn();
        const action = createMockAction();

        renderWithContext(<NotificationList />, {
          notifications,
          onItemSelect,
          actions: [action],
        });

        fireEvent.click(screen.getByRole('button', { name: 'Mock Action' }));

        expect(action.onClick).toHaveBeenCalledWith(notifications[0]);
        expect(onItemSelect).not.toHaveBeenCalled();
      });

      it('does not call onItemSelect when clicking action inside the menu', () => {
        const notifications = createNotificationList(1);
        const onItemSelect = vi.fn();
        const action = createMockAction({ label: 'Secondary' });

        renderWithContext(<NotificationList />, {
          notifications,
          actions: [createMockAction(), action],
          onItemSelect,
        });

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Secondary'));

        expect(action.onClick).toHaveBeenCalledWith(notifications[0]);
        expect(onItemSelect).not.toHaveBeenCalled();
      });
    });

    describe('TrailingAction', () => {
      it('does not render any action button when no actions are provided', () => {
        const notification = createMockNotification();

        const { container } = renderWithContext(<NotificationList />, { notifications: [notification] });
        const button = getTrailingButton(container, notification);

        expect(button).not.toBeInTheDocument();
      });

      describe('with single action', () => {
        it('renders action button when a single action is provided', () => {
          const notification = createMockNotification();
          const action = createMockAction({ label: 'Mock Action' });

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);

          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent('Mock Action');
        });

        it('renders static action icon', () => {
          const notification = createMockNotification();
          const action = createMockAction({ label: 'Mock Action', icon: <span data-testid="mock-icon">🔔</span> });

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);

          expect(button.querySelector('span[data-testid="mock-icon"]')).toBeInTheDocument();
        });

        it('renders icon from action.getIcon(item)', () => {
          const getIcon = vi.fn(() => <span data-testid="mock-icon">🔔</span>);
          const notification = createMockNotification();
          const action = createMockAction({ label: 'Mock Action', getIcon });

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);

          expect(button).toBeInTheDocument();
          expect(button.querySelector('span[data-testid="mock-icon"]')).toBeInTheDocument();
          expect(getIcon).toHaveBeenCalledWith(notification);
        });

        it('renders label from action.getLabel(item)', () => {
          const getLabel = vi.fn(() => 'Label by getLabel');
          const notification = createMockNotification();
          const action = createMockAction({ label: undefined, getLabel });

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);

          expect(button).toBeInTheDocument();
          expect(screen.getByText('Label by getLabel')).toBeInTheDocument();
          expect(getLabel).toHaveBeenCalledWith(notification);
        });

        it('calls action.onClick on click', () => {
          const notification = createMockNotification();
          const action = createMockAction();

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);
          fireEvent.click(button);

          expect(action.onClick).toHaveBeenCalledWith(notification);
        });

        it('calls action.onClick on interaction via keyboard', async () => {
          const notification = createMockNotification();
          const action = createMockAction();
          const user = userEvent.setup();

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions: [action],
          });
          const button = getTrailingButton(container, notification);

          button.focus();
          await user.keyboard('{ }');

          expect(action.onClick).toHaveBeenCalledWith(notification);
        });
      });

      describe('with multiple actions', () => {
        it('renders menu trigger when more than one action exists', () => {
          const notification = createMockNotification();
          const actions = [createMockAction({ label: 'First' }), createMockAction({ label: 'Second' })];

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions,
          });
          const menuTrigger = getTrailingButton(container, notification);

          expect(menuTrigger).toBeInTheDocument();
          expect(menuTrigger.querySelector('svg')).toBeInTheDocument();
        });

        it('renders all menu items', () => {
          const notification = createMockNotification();
          const actions = [createMockAction({ label: 'First' }), createMockAction({ label: 'Second' })];

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions,
          });
          const menuTrigger = getTrailingButton(container, notification);

          fireEvent.click(menuTrigger);

          expect(screen.getByRole('menu')).toBeInTheDocument();
          expect(screen.getByText('First')).toBeInTheDocument();
          expect(screen.getByText('Second')).toBeInTheDocument();
        });

        it('renders icon from action.icon', () => {
          const notifications = createNotificationList(1);
          const actions = [
            createMockAction({ label: 'First', icon: <span data-testid="first-icon">🔔</span> }),
            createMockAction({ label: 'Second', icon: () => <span data-testid="second-icon">🔔</span> }),
          ];

          const { container } = renderWithContext(<NotificationList />, { notifications, actions });
          const menuTrigger = getTrailingButton(container, notifications[0]);
          fireEvent.click(menuTrigger);

          expect(screen.getByTestId('first-icon')).toBeInTheDocument();
          expect(screen.getByTestId('second-icon')).toBeInTheDocument();
        });

        it('renders icon from action.getIcon(item)', () => {
          const notifications = createNotificationList(1);
          const actions = [
            createMockAction({ label: 'First', getIcon: () => <span data-testid="first-icon">🔔</span> }),
            createMockAction({ label: 'Second', getIcon: () => <span data-testid="second-icon">🔔</span> }),
          ];

          const { container } = renderWithContext(<NotificationList />, { notifications, actions });
          const menuTrigger = getTrailingButton(container, notifications[0]);
          fireEvent.click(menuTrigger);

          expect(screen.getByTestId('first-icon')).toBeInTheDocument();
          expect(screen.getByTestId('second-icon')).toBeInTheDocument();
        });

        it('renders label from action.getLabel(item)', () => {
          const notification = createMockNotification();
          const getLabel1 = vi.fn(() => 'First Action');
          const getLabel2 = vi.fn(() => 'Second Action');

          const actions = [
            createMockAction({ label: undefined, getLabel: getLabel1 }),
            createMockAction({ label: undefined, getLabel: getLabel2 }),
          ];

          const { container } = renderWithContext(<NotificationList />, {
            notifications: [notification],
            actions,
          });
          const menuTrigger = getTrailingButton(container, notification);
          fireEvent.click(menuTrigger);

          expect(getLabel1).toHaveBeenCalledWith(notification);
          expect(getLabel2).toHaveBeenCalledWith(notification);
          expect(screen.getByText('First Action')).toBeInTheDocument();
          expect(screen.getByText('Second Action')).toBeInTheDocument();
        });

        it('calls correct action.onClick on menu selection', () => {
          const notificationsBefore = createNotificationList(3);
          const targetNotification = createMockNotification({
            title: 'Target Notification',
          });
          const notificationsAfter = createNotificationList(2);
          const notifications = [...notificationsBefore, targetNotification, ...notificationsAfter];

          const firstAction = createMockAction({ label: 'First Action' });
          const targetAction = createMockAction({ label: 'Target Action' });

          renderWithContext(<NotificationList />, { notifications, actions: [firstAction, targetAction] });

          const trailingAction = getTrailingButton(
            screen.getByText('Target Notification').closest('li'),
            notifications[3],
          );

          expect(trailingAction).toBeInTheDocument();
          fireEvent.click(trailingAction);

          const targetButton = screen.getByText('Target Action');
          fireEvent.click(targetButton);

          expect(targetAction.onClick).toHaveBeenCalledWith(notifications[3]);
          expect(firstAction.onClick).not.toHaveBeenCalled();
        });

        it('calls correct action.onClick on menu selection via keyboard', async () => {
          const notificationsBefore = createNotificationList(2);
          const targetNotification = createMockNotification({
            title: 'Target Notification',
          });
          const notificationsAfter = createNotificationList(3);
          const notifications = [...notificationsBefore, targetNotification, ...notificationsAfter];
          const firstAction = createMockAction({ label: 'First Action' });
          const targetAction = createMockAction({ label: 'Target Action' });
          const user = userEvent.setup();

          renderWithContext(<NotificationList />, { notifications, actions: [firstAction, targetAction] });

          const trailingAction = getTrailingButton(
            screen.getByText('Target Notification').closest('li'),
            notifications[2],
          );

          expect(trailingAction).toBeInTheDocument();

          await act(async () => {
            trailingAction.focus();
            await user.keyboard('{ }');
          });

          const targetButton = screen.getByText('Target Action');
          fireEvent.keyPress(targetButton, { key: 'Enter', code: 'Enter', charCode: 13 });

          expect(targetAction.onClick).toHaveBeenCalledWith(notifications[2]);
          expect(firstAction.onClick).not.toHaveBeenCalled();
        });

        it('closes the menu after selecting an action', () => {
          const notifications = createNotificationList(1);
          const actions = [createMockAction({ label: 'First' }), createMockAction({ label: 'Second' })];

          const { container } = renderWithContext(<NotificationList />, { notifications, actions });

          const menuTrigger = getTrailingButton(container, notifications[0]);
          fireEvent.click(menuTrigger);

          expect(screen.getByRole('menu')).toBeInTheDocument();

          const firstAction = screen.getByText('First');
          fireEvent.click(firstAction);

          expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        resetNotificationCount();
      });

      const defaultTitle = 'Notification 1';
      const defaultBody = 'Body for notification 1';

      describe('notifications', () => {
        test.each([[], null, undefined, ''])(
          'shows empty state label when notifications prop is %s',
          (notifications) => {
            const labels = { empty: 'No notifications available' };

            renderWithContext(<NotificationList />, { notifications, labels });

            expect(screen.getByText(labels.empty)).toBeInTheDocument();
          },
        );
      });

      describe('notification.title', () => {
        it('renders string title', () => {
          const notifications = createNotificationList(1, { title: 'Simple Title' });

          renderWithContext(<NotificationList />, { notifications });

          expect(screen.getByText('Simple Title')).toBeInTheDocument();
        });

        it('renders React component title', () => {
          const CustomTitle = () => <div data-testid="custom-title">Custom Component Title</div>;
          const notifications = createNotificationList(1, { title: <CustomTitle /> });

          renderWithContext(<NotificationList />, { notifications });

          expect(screen.getByTestId('custom-title')).toBeInTheDocument();
          expect(screen.getByText('Custom Component Title')).toBeInTheDocument();
        });

        test.each([undefined, null, ''])('renders safely when title is %s', (title) => {
          const notifications = createNotificationList(1, { title });

          renderWithContext(<NotificationList />, { notifications });

          expect(screen.getByText(defaultBody)).toBeInTheDocument();
          expect(screen.queryByText(defaultTitle)).not.toBeInTheDocument();
        });
      });

      describe('notification.body', () => {
        test.each([undefined, null, ''])('renders safely when body is %s', (body) => {
          const notifications = createNotificationList(1, { body });

          renderWithContext(<NotificationList />, { notifications });

          expect(screen.getByText(defaultTitle)).toBeInTheDocument();
          expect(screen.queryByText(defaultBody)).not.toBeInTheDocument();
        });
      });

      describe('focusSiblingIfRemoved', () => {
        beforeEach(() => {
          vi.useFakeTimers();
        });

        afterEach(() => {
          vi.useRealTimers();
        });

        it('transfers focus to the next sibling if current element is removed', () => {
          const { container } = renderWithContext(
            <div>
              <div id="item-1" tabIndex={-1}>
                Item 1
              </div>
              <div id="item-2" tabIndex={-1}>
                Item 2
              </div>
              <div id="item-3" tabIndex={-1}>
                Item 3
              </div>
            </div>,
          );

          const item2 = container.querySelector('#item-2');
          item2.focus();
          expect(item2).toHaveFocus();

          focusSiblingIfRemoved(item2.id);
          item2.remove();
          vi.runAllTimers();

          const item3 = container.querySelector('#item-3');
          expect(item3).toHaveFocus();
        });

        it('transfers focus to the previous sibling if current element is removed and no next sibling', () => {
          const { container } = renderWithContext(
            <div>
              <div id="item-1" tabIndex={-1}>
                Item 1
              </div>
              <div id="item-2" tabIndex={-1}>
                Item 2
              </div>
              <div id="item-3" tabIndex={-1}>
                Item 3
              </div>
            </div>,
          );

          const item3 = container.querySelector('#item-3');
          item3.focus();
          expect(item3).toHaveFocus();

          focusSiblingIfRemoved(item3.id);
          item3.remove();
          vi.runAllTimers();

          const item2 = container.querySelector('#item-2');
          expect(item2).toHaveFocus();
        });

        it('does nothing if current element is not in DOM and no siblings', () => {
          const { container } = renderWithContext(
            <div>
              <div id="item-1" tabIndex={-1}>
                Item 1
              </div>
            </div>,
          );

          const item1 = container.querySelector('#item-1');
          item1.focus();
          expect(item1).toHaveFocus();

          focusSiblingIfRemoved(item1.id);
          item1.remove();
          vi.runAllTimers();

          expect(document.body).toHaveFocus();
        });

        it('does not change focus if current element is not removed', () => {
          vi.useFakeTimers();

          const { container } = renderWithContext(
            <div>
              <div id="item-1" tabIndex={-1}>
                Item 1
              </div>
              <div id="item-2" tabIndex={-1}>
                Item 2
              </div>
            </div>,
          );

          const item1 = container.querySelector('#item-1');
          item1.focus();
          expect(item1).toHaveFocus();

          focusSiblingIfRemoved(item1.id);
          vi.runAllTimers();

          expect(item1).toHaveFocus();
        });

        it('does not throw if element is not found', () => {
          expect(() => {
            focusSiblingIfRemoved('non-existent-id');
          }).not.toThrow();
        });
      });
    });
  });
});

function getTrailingButton(container, notification) {
  const selectors = getConfig().selectors;
  const trailingVisual = container.querySelector(`#notification-${notification?.id}--trailing-visual`);

  if (trailingVisual) {
    return trailingVisual.querySelector('button');
  }

  const trailingAction = container.querySelector(`[${selectors.notificationTrailingAction}]`);
  return trailingAction;
}
