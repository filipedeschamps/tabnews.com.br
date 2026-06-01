'use client';
import { BellIcon, XIcon } from '@primer/octicons-react';
import { AnchoredOverlay, Heading, IconButton } from '@primer/react';
import clsx from 'clsx';

import { NotificationList } from './NotificationList';
import classes from './NotificationMenu.module.css';
import { useNotifications } from './Provider';

/**
 * @typedef {import('@primer/react').AnchoredOverlayProps} AnchoredOverlayProps
 * @typedef {import('@primer/react').IconButtonProps} IconButtonProps
 * @typedef {import('./types.js').NotificationLabels} NotificationLabels
 */

/**
 * Renders a notification menu with a bell icon and a list of notifications.
 * The bell icon can display a badge with the notification count.
 *
 * @param {object} props - The configuration object for the notification menu.
 * @property {JSX.Element} [props.topBar] - Content to display as the menu header.
 * @property {JSX.Element} [props.sectionIntro] - Introductory content for the notification section.
 * @property {JSX.Element} [props.footer] - Content to display at the bottom of the menu.
 * @property {IconButtonProps} [props.buttonProps] - Props to pass to the IconButton that toggles the menu.
 * @property {AnchoredOverlayProps} [props.overlayProps] - Additional props for the AnchoredOverlay component.
 * @returns {JSX.Element} A React component that displays the notification menu.
 */
export function NotificationMenu({ topBar, sectionIntro, footer, buttonProps, overlayProps }) {
  const { getCount, isMenuOpen, setMenuOpen, labels, notifications, onCloseMenu } = useNotifications();
  const count = getCount?.(notifications);

  const onOpen = () => setMenuOpen(true);
  const onClose = () => {
    onCloseMenu?.();
    setMenuOpen(false);
  };

  return (
    <AnchoredOverlay
      open={isMenuOpen}
      onOpen={onOpen}
      onClose={onClose}
      width="large"
      preventOverflow={false}
      renderAnchor={(anchorProps) => (
        <IconButton
          aria-label={labels.getBellLabel(count)}
          // eslint-disable-next-line react/no-unstable-nested-components
          icon={() => <IconWithBadge count={count} />}
          variant="invisible"
          {...anchorProps}
          {...buttonProps}
          className={clsx(classes.AnchorButton, count === 0 && classes.AnchorButtonEmpty, buttonProps?.className)}
        />
      )}
      overlayProps={{
        role: 'dialog',
        ...overlayProps,
        className: clsx(classes.Overlay, overlayProps?.className),
      }}>
      <HeaderWithClose labels={labels} onClose={onClose} topBar={topBar} />
      <div className={classes.Body}>
        {sectionIntro}
        <NotificationList />
        {footer}
      </div>
    </AnchoredOverlay>
  );
}

/**
 * Renders a bell icon with an optional notification badge.
 *
 * @param {object} props - The props for the IconWithBadge component.
 * @param {number} props.count - The number of notifications to display in the badge.
 * @returns {JSX.Element} A React component that displays the bell icon with a badge.
 */
function IconWithBadge({ count }) {
  return (
    <div className={classes.BadgeWrapper}>
      <BellIcon />
      {count > 0 && (
        <div data-testid="notification-badge" className={classes.Badge}>
          <span className={classes.BadgeCount}>{count > 99 ? '99+' : count}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the header for the notification menu, including a title and a close button.
 *
 * @param {object} props - The props for the HeaderWithClose component.
 * @param {NotificationLabels} props.labels - An object containing labels used in the component.
 * @param {function(): void} props.onClose - Callback function when the close button is clicked.
 * @param {string|JSX.Element} [props.topBar] - A string or JSX element to be rendered as the top bar of the menu.
 * @returns {JSX.Element} A React component that displays the menu header.
 */
function HeaderWithClose({ labels, onClose, topBar }) {
  return (
    <div className={classes.Header}>
      <div className={classes.HeaderTitleWrapper}>
        {topBar || (
          <Heading as="h2" className={classes.HeaderTitle}>
            {labels.notifications}
          </Heading>
        )}
      </div>

      <IconButton
        variant="invisible"
        icon={XIcon}
        onClick={onClose}
        aria-label={labels.close}
        className={classes.CloseButton}
      />
    </div>
  );
}
