import { Tooltip, IconButton, ActionList, ActionMenu } from '@primer/react';
import { BellIcon } from '@primer/octicons-react';

import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useNotification, useContent } from 'pages/interface';

export default function Notifications() {
  const [notificationText, setNotificationText] = useState('');
  const [isNotificationListOpen, setIsNotificationListOpen] = useState(false);

  const {
    notifications,
    isLoading: notificationsAreLoading,
    isValidating: notificationsAreValidating,
  } = useNotification();

  const { contents, isLoading: contentsAreLoading, mutate } = useContent();

  function handleOpenNotificationList() {
    setIsNotificationListOpen(!isNotificationListOpen);
  }

  useEffect(() => {
    if (!contentsAreLoading) {
      if (!notificationsAreLoading && notifications && notifications.length !== 0) {
        notifications.map((notification) => {});
      }
    }
  }, [notificationsAreValidating, contentsAreLoading]);

  useEffect(() => {
    if (!notificationsAreLoading) {
      if (notifications.length > 0) {
        if (notifications.length === 1) {
          setNotificationText('Você tem ' + notifications.length + ' notificação');
        } else {
          setNotificationText('Você tem ' + notifications.length + ' notificações');
        }
      } else {
        setNotificationText('Você não tem novas notificações');
      }
    }
  }, [notifications, notificationsAreLoading]);

  return (
    <Tooltip text={notificationText} direction="s">
      <ActionMenu>
        <ActionMenu.Anchor>
          <IconButton aria-label="Notificações" icon={BellIcon} onClick={handleOpenNotificationList} />
        </ActionMenu.Anchor>

        <ActionMenu.Overlay>
          <ActionList>
            {notificationList.map(({ redirect_to, key, title }, index, arr) => {
              return (
                <>
                  <ActionList.LinkItem href={redirect_to} key={key} on>
                    {title}
                  </ActionList.LinkItem>{' '}
                  {arr.length !== index + 1 && <ActionList.Divider />}
                </>
              );
            })}
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
    </Tooltip>
  );
}
