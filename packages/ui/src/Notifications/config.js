/**
 * @typedef {import('./types.js').NotificationItem} NotificationItem
 * @typedef {import('./types.js').NotificationLabels} NotificationLabels
 * @typedef {import('./types.js').NotificationSelectors} NotificationSelectors
 * @typedef {import('./types.js').GetBellLabel} GetBellLabel
 */

/**
 * Default configuration for the notification components.
 * @type {object}
 * @property {NotificationItem[]} notifications - Array of notification items.
 * @property {function(boolean): void} setMenuOpen - Function to set the open state of the notification menu.
 * @property {NotificationLabels} labels - Default labels for various parts of the notification UI.
 * @property {NotificationSelectors} selectors - Default CSS selectors used for identifying elements.
 */
const DEFAULT_CONFIG = {
  notifications: [],
  setMenuOpen: () => {},
  labels: {
    notifications: 'Notifications',
    close: 'Close',
    empty: 'No notifications available',
    loading: 'Loading...',
    openActionsMenu: 'Open menu',
    getBellLabel,
  },
  selectors: {
    notificationTrailingAction: 'data-tabnews-ui-notification-action',
  },
};

/** @type {GetBellLabel} */
function getBellLabel(count) {
  switch (true) {
    case count === 0:
      return 'No unread notifications';
    case count === 1:
      return '1 unread notification';
    case count > 1:
      return `${count} unread notifications`;
    default:
      return 'Notifications';
  }
}

/**
 * Merges a custom configuration with the default notification configuration.
 *
 * @param {object} [customConfig={}] - The custom configuration object.
 * @returns {object} The merged configuration object.
 */
export function getConfig(customConfig = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...customConfig,
    labels: {
      ...DEFAULT_CONFIG.labels,
      ...customConfig.labels,
    },
    selectors: {
      ...DEFAULT_CONFIG.selectors,
      ...customConfig.selectors,
    },
  };
}
