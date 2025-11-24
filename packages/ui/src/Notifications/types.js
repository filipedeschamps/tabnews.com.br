/**
 * @typedef {object} NotificationItem
 * @property {string} id - The unique identifier for the notification.
 * @property {string|JSX.Element} title - The title of the notification. Can be a plain string or a React component.
 * @property {string|JSX.Element} body - The body or description of the notification.
 */

/**
 * @typedef {object} NotificationAction
 * @property {string} [label] - The label for the action button.
 * @property {function(NotificationItem): string} [getLabel] - A function that returns the label for the action button, receiving the notification item as an argument.
 * @property {JSX.Element|function(): JSX.Element} [icon] - The icon for the action button. Can be a React component or a function returning one.
 * @property {function(NotificationItem): JSX.Element | function(): JSX.Element} [getIcon] - A function that returns the icon for the action button, receiving the notification item as an argument.
 * @property {function(NotificationItem): void} onClick - The callback function to be executed when the action is clicked, receiving the notification item as an argument.
 */

/**
 * Generates a label for the bell icon based on the number of unread notifications.
 *
 * @callback GetBellLabel
 * @param {number} count - The number of unread notifications.
 * @returns {string} The label for the bell icon.
 */

/**
 * @typedef {object} NotificationLabels
 * @property {string} [empty] - Message for when there are no notifications.
 * @property {string} [loading] - Message for when notifications are loading.
 * @property {string} [notifications] - Title for the notifications menu.
 * @property {string} [close] - Label for the close button.
 * @property {string} [openActionsMenu] - Label for the button to open the actions menu.
 * @property {GetBellLabel} [getBellLabel] - Generates aria-label for the bell icon.
 */

/**
 * @typedef {object} NotificationSelectors
 * @property {string} notificationTrailingAction - Selector for the trailing action on a notification item.
 */

/**
 * @typedef {object} NotificationCommonConfig
 * @property {NotificationAction[]} [actions] - Actions for each notification item.
 * @property {function(NotificationItem): JSX.Element | null} [getItemIcon] - Function to get the icon for a notification item.
 * @property {function(NotificationItem): boolean} [isItemRead] - Function to check if a notification item is read.
 * @property {boolean} [isLoading] - Indicates if the notifications are currently loading.
 * @property {NotificationLabels} [labels] - Labels for the notification UI.
 * @property {NotificationItem[]} [notifications] - Array of notification objects.
 * @property {function(NotificationItem): void} [onItemSelect] - Callback function when the notification item is selected.
 * @property {NotificationSelectors} [selectors] - An object containing CSS selectors for elements.
 */

/**
 * @typedef {object} NotificationsMenuConfig
 * @property {function(NotificationItem[]): number} [getCount] - Function to get the count of notifications.
 * @property {boolean} [isMenuOpen] - Whether the menu is currently open.
 * @property {function(): void} [onCloseMenu] - Callback function when the menu is closed.
 * @property {function(boolean): void} [setMenuOpen] - Function to update the menu's open state.
 */

/**
 * @typedef {NotificationCommonConfig & NotificationsMenuConfig} NotificationsContextType
 */
