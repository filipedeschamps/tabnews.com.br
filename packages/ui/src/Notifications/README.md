# Notifications

This module provides a flexible system for displaying notifications. It is built around three main concepts:

1.  **`NotificationsProvider`**: A React context provider that centralizes all state and logic.
2.  **`useNotifications`**: A hook that allows components to access the provider's state and functions.
3.  **UI Components**: `NotificationMenu` (for a dropdown menu) and `NotificationList` (for a dedicated page list), which consume data from the provider to render the UI.

The core idea is that your application controls all business logic (like fetching data, marking notifications as read, etc.) and passes it to the `NotificationsProvider`. The UI components are "dumb" and only render what the provider gives them.

## How to Use

The best approach is to create a custom hook in your application (e.g., `useNotificationConfig`) that encapsulates all notification logic and returns the necessary props for the `NotificationsProvider`.

### 1. Create a Configuration Hook

This hook will be the brain of your notification system. It will fetch data, define actions, and manage state. The example below is based on the actual implementation found in [`@examples/form`](https://github.com/filipedeschamps/tabnews/blob/main/examples/form/components/Notifications/Notifications.jsx).

**`hooks/useNotificationConfig.js` (example in your application)**

```jsx
import { CheckIcon, TrashIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Function to fetch your notifications (e.g., from an API)
async function getNotificationsFromAPI(options) {
  // ...your fetch logic
}

export function useNotificationConfig() {
  const [notifications, setNotifications] = useState([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch initial notifications
  useEffect(() => {
    setIsLoading(true);
    getNotificationsFromAPI({ cursor: 0, size: 20 }).then((response) => {
      setNotifications(response.notifications);
      setIsLoading(false);
    });
  }, []);

  // Action executed when an item is selected
  const onItemSelect = (notification) => {
    // Mark as read
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));

    // Close the menu and navigate
    if (isMenuOpen) {
      setMenuOpen(false);
    }
    if (notification.url) {
      router.push(notification.url);
    }
  };

  // Define the actions available for each notification
  const actions = [
    {
      getLabel: (item) => (item.read ? 'Mark as unread' : 'Mark as read'),
      icon: CheckIcon,
      onClick: (item) => {
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: !n.read } : n)));
      },
    },
    {
      label: 'Dismiss',
      icon: TrashIcon,
      onClick: (item) => {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      },
    },
  ];

  return {
    // State and Logic
    notifications,
    isLoading,
    isMenuOpen,
    setMenuOpen,
    onItemSelect,
    actions,

    // Functions to customize the UI
    isItemRead: (item) => item.read,
    getCount: (items) => items.filter((n) => !n.read).length,
    getItemIcon: (item) => {
      // Return an icon based on the notification type
      // ex: return <CommentIcon />;
    },
  };
}
```

### 2. Wrap Your Application with the Provider

In your main layout, use the created hook to configure the `NotificationsProvider`.

**`app/layout.js` (in your application)**

```jsx
'use client';
import { NotificationsProvider, NotificationMenu } from '@tabnews/ui';
import { useNotificationConfig } from '../hooks/useNotificationConfig';

// Create a reusable component for the notification menu
function NotificationCenter() {
  return (
    <NotificationMenu
      footer={
        <a href="/notifications" style={{ padding: '8px', textAlign: 'center' }}>
          View all
        </a>
      }
    />
  );
}

export default function RootLayout({ children }) {
  const notificationConfig = useNotificationConfig();

  return (
    <html lang="en">
      <body>
        <NotificationsProvider {...notificationConfig}>
          <header>
            {/* Render the notification menu in the header */}
            <NotificationCenter />
          </header>
          <main>{children}</main>
        </NotificationsProvider>
      </body>
    </html>
  );
}
```

### 3. Use the UI Components

With the provider set up, you can use the components anywhere in your application.

#### `NotificationMenu`

Ideal for headers. It renders a bell icon that, when clicked, opens an overlay with the `NotificationList`. It is recommended to create a wrapper for it (like `NotificationCenter` in the example above) to configure elements like the footer.

#### `NotificationList`

Ideal for a dedicated page (e.g., `/notifications`). It renders the list of notifications and consumes the `isLoading` state from the provider to display a spinner.

```jsx
import { NotificationList } from '@tabnews/ui';

export default function NotificationsPage() {
  return (
    <div>
      <h1>Notifications</h1>
      {/* The list is already connected to the provider */}
      <NotificationList />
    </div>
  );
}
```

## Props API

### Props for `NotificationsProvider`

These are the props you can pass to the `NotificationsProvider` to control all behavior.

| Prop            | Type                                      | Description                                                                           |
| :-------------- | :---------------------------------------- | :------------------------------------------------------------------------------------ |
| `notifications` | `NotificationItem[]`                      | **Required**. The list of notification objects to display.                            |
| `actions`       | `NotificationAction[]`                    | Actions available for each item (e.g., "Mark as read", "Archive").                    |
| `onItemSelect`  | `(item: NotificationItem) => void`        | Function called when a list item is clicked.                                          |
| `isItemRead`    | `(item: NotificationItem) => boolean`     | Function that determines if a notification should have the "read" style.              |
| `getItemIcon`   | `(item: NotificationItem) => JSX.Element` | Function that returns an icon for each notification type.                             |
| `isLoading`     | `boolean`                                 | If `true`, displays the loading state in the `NotificationList`.                      |
| `labels`        | `object`                                  | Object to override default texts (e.g., `empty`, `loading`, `close`).                 |
| `isMenuOpen`    | `boolean`                                 | Controls the visibility of the `NotificationMenu`.                                    |
| `setMenuOpen`   | `(isOpen: boolean) => void`               | Function to update the visibility state of the `NotificationMenu`.                    |
| `getCount`      | `(items: NotificationItem[]) => number`   | Function that calculates the number to be displayed on the bell badge.                |
| `onCloseMenu`   | `() => void`                              | Callback called when the menu is closed. Useful for reordering the list, for example. |

### Props for `NotificationMenu`

In addition to the props consumed from the provider, you can customize the `NotificationMenu` directly.

| Prop           | Type          | Description                                                     |
| :------------- | :------------ | :-------------------------------------------------------------- |
| `topBar`       | `JSX.Element` | Custom content for the menu header (replaces the title).        |
| `sectionIntro` | `JSX.Element` | Content displayed between the header and the notification list. |
| `footer`       | `JSX.Element` | Content displayed at the bottom of the menu.                    |
| `buttonProps`  | `object`      | Additional props for the bell `IconButton`.                     |
| `overlayProps` | `object`      | Additional props for the `AnchoredOverlay`.                     |
