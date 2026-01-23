'use client';
import { KebabHorizontalIcon } from '@primer/octicons-react';
import { ActionList, ActionMenu, Box, Button, IconButton } from '@primer/react';
import { createElement, isValidElement, useRef, useState } from 'react';

import { Pagination } from '@/TabNewsUI';

import { useNotifications } from './Provider';

/**
 * @typedef {import('@primer/react').ActionMenuProps} PrimerActionMenuProps
 * @typedef {import('./types.js').NotificationItem} NotificationType
 * @typedef {import('./types.js').NotificationAction} NotificationAction
 * @typedef {import('./types.js').NotificationSelectors} NotificationSelectors
 */

/**
 * Renders a list of notifications or empty/loading states based on the notifications context.
 *
 * @returns {JSX.Element} A React component that displays the notification list.
 */
export function NotificationList() {
  const { notifications, isLoading, labels, onMarkAllAsRead, getCount, pagination, showPagination } =
    useNotifications();

  if (!notifications?.length && !isLoading) {
    return (
      <Box sx={{ m: 3, textAlign: 'center' }}>
        <span>{labels.empty}</span>
      </Box>
    );
  }

  return (
    <>
      {getCount?.(notifications) > 0 && typeof onMarkAllAsRead === 'function' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <Button
            variant="invisible"
            size="small"
            onClick={onMarkAllAsRead}
            sx={{
              color: 'fg.muted',
              '&:hover': {
                color: 'fg.default',
                bg: 'canvas.subtle',
              },
            }}>
            {labels.markAllAsRead || 'Marcar todas como lidas'}
          </Button>
        </Box>
      )}
      <ActionList>
        {notifications.map((item) => (
          <NotificationItem key={item.id} item={item} />
        ))}

        {isLoading && (
          <ActionList.Item disabled loading>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span>{labels.loading}</span>
            </Box>
          </ActionList.Item>
        )}
        {showPagination && <Pagination {...pagination} />}
      </ActionList>
    </>
  );
}

/**
 * Renders an individual notification item.
 *
 * @param {object} props - The props for the NotificationItem component.
 * @param {NotificationType} props.item - The notification item to display.
 * @returns {JSX.Element} A React component that displays a single notification item.
 */
function NotificationItem({ item }) {
  const { actions = [], getItemIcon, isItemRead, labels, onItemSelect, selectors } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef();
  const isNotificationRead = isItemRead?.(item);
  const color = isNotificationRead ? 'var(--fgColor-disabled)' : 'var(--fgColor-default)';
  const primaryAction = actions[0];

  return (
    <ActionList.Item
      id={`notification-${item.id}`}
      sx={{ color }}
      onSelect={(e) => {
        if (isEventFromTrailingButton(e, item.id, selectors)) return;
        onItemSelect?.(item);
      }}>
      {getItemIcon && <ActionList.LeadingVisual>{getItemIcon(item)}</ActionList.LeadingVisual>}

      {item.title}
      {item.created_at && (
        <Box as="span" sx={{ color: 'var(--fgColor-muted)', fontSize: 0, ml: 2 }}>
          • {formatTimeAgo(item.created_at)}
        </Box>
      )}

      <ActionList.Description variant="block">
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body}</Box>
      </ActionList.Description>

      {actions.length === 1 && (
        <ActionList.TrailingAction
          {...{ [selectors.notificationTrailingAction]: '' }}
          label={primaryAction.label || primaryAction.getLabel?.(item)}
          icon={primaryAction.icon || primaryAction.getIcon?.(item)}
          onClick={(e) => onActionClick(e, primaryAction, item, setMenuOpen)}
        />
      )}

      {actions.length > 1 && (
        <ActionList.TrailingVisual>
          <IconButton
            ref={menuAnchorRef}
            icon={KebabHorizontalIcon}
            variant="invisible"
            aria-label={labels.openActionsMenu}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          />

          <CustomActionMenu
            actions={actions}
            anchorRef={menuAnchorRef}
            notification={item}
            open={menuOpen}
            setOpen={setMenuOpen}
          />
        </ActionList.TrailingVisual>
      )}
    </ActionList.Item>
  );
}

/**
 * Checks if a given event originated from a trailing button within a notification item.
 *
 * @param {React.SyntheticEvent} event - The event object.
 * @param {string} id - The ID of the notification item.
 * @param {NotificationSelectors} selectors - An object containing CSS selectors.
 * @returns {boolean} True if the event is from a trailing button, false otherwise.
 */
function isEventFromTrailingButton(event, id, selectors) {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  return (
    !!target.closest(`#notification-${id}--trailing-visual`) ||
    !!target.closest(`[${selectors.notificationTrailingAction}]`)
  );
}

/**
 * Additional custom props for the ActionMenu.
 *
 * @typedef {object} ActionMenuCustomProps
 * @property {NotificationAction[]} actions - An array of action objects for the menu.
 * @property {NotificationType} notification - The notification item object.
 * @property {(open: boolean) => void} setOpen - A function to set the open state of the menu.
 * @property {object} anchorRef - A ref to the anchor element for the menu.
 */

/**
 * Props for the custom ActionMenu component.
 * Extends the props from @primer/react's ActionMenuProps.
 *
 * @typedef {Omit<PrimerActionMenuProps, 'children'> & ActionMenuCustomProps} ActionMenuProps
 */

/**
 * Renders an action menu for a notification item.
 *
 * @param {ActionMenuProps} props - The props for the ActionMenu component.
 * @returns {JSX.Element|null} A React component that displays the action menu.
 */
function CustomActionMenu({ actions, notification, setOpen, ...rest }) {
  return (
    <ActionMenu onOpenChange={setOpen} {...rest}>
      <ActionMenu.Overlay preventOverflow={false} side="outside-left" align="center">
        <ActionList>
          {actions.map((action, index) => (
            <ActionList.Item key={index} onSelect={(e) => onActionClick(e, action, notification, setOpen)}>
              {action.label || action.getLabel?.(notification)}
              <ActionList.LeadingVisual>{renderIcon(action, notification)}</ActionList.LeadingVisual>
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

/**
 * Renders the icon for a notification action.
 *
 * @param {NotificationAction} action - The action object containing icon information.
 * @param {NotificationType} notificationItem - The notification item object.
 * @returns {JSX.Element|null} A React component representing the icon, or null if no icon is provided.
 */
function renderIcon(action, notificationItem) {
  const icon = action.icon || action.getIcon?.(notificationItem);

  if (!icon) return null;

  if (isValidElement(icon)) {
    return icon;
  }

  return createElement(icon);
}

/**
 * Handles the click event for an action within a notification item.
 *
 * @param {React.SyntheticEvent} event - The event object.
 * @param {NotificationAction} action - The action object that was clicked.
 * @param {NotificationType} notification - The notification item associated with the action.
 * @param {Function} setMenuOpen - A function to set the open state of the action menu.
 */
function onActionClick(event, action, notification, setMenuOpen) {
  event.stopPropagation();
  focusSiblingIfRemoved(`notification-${notification.id}`);
  action.onClick?.(notification);
  setMenuOpen(false);
}

/**
 * Focuses the next or previous sibling element if the current element is removed from the DOM.
 * This is useful for maintaining focus in accessibility scenarios.
 *
 * @param {string} currentId - The ID of the current element.
 */
export function focusSiblingIfRemoved(currentId) {
  const currentElement = document.getElementById(currentId);
  if (!currentElement) return;

  const nextElement = currentElement.nextElementSibling || currentElement.previousElementSibling;
  if (!nextElement) return;

  requestAnimationFrame(() => {
    if (!document.contains(currentElement) && document.contains(nextElement) && nextElement instanceof HTMLElement) {
      nextElement.focus();
    }
  });
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
