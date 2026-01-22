'use client';
import { createContext, useContext } from 'react';

import { getConfig } from './config';

/**
 * @typedef {import('./types.js').NotificationsContextType} NotificationsContextType
 */

/** @type {React.Context<NotificationsContextType | null>} */
const NotificationsContext = createContext(null);

/**
 * Hook to access the notifications context.
 * Must be used within a NotificationsProvider.
 * @returns {NotificationsContextType} The context value.
 */
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx && process.env.NODE_ENV !== 'production') {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}

/**
 * Provides notification context to its children.
 *
 * @param {{ children: React.ReactNode } & NotificationsContextType} props - The props for the NotificationsProvider component.
 * @returns {JSX.Element} A React context provider.
 */
export function NotificationsProvider({ children, ...props }) {
  return <NotificationsContext.Provider value={getConfig(props)}>{children}</NotificationsContext.Provider>;
}
