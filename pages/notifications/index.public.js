import { NotificationList } from '@tabnews/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { DefaultLayout, NotificationsProvider } from '@/TabNewsUI';
import { useNotificationConfig, useUser } from 'pages/interface';

export default function NotificationsPage() {
  const router = useRouter();
  const page = router.query.page || 1;
  const { user } = useUser();
  const [options, setOptions] = useState({ is_page: true, page: page, per_page: 10 });
  useEffect(() => {
    setOptions({ is_page: true, page: page, per_page: 10 });
  }, [page]);
  const notificationConfig = useNotificationConfig({ user, options });
  return (
    <DefaultLayout
      containerWidth="medium"
      metadata={{
        title: 'Notificações',
        description: 'Gerencie suas notificações e veja as interações recentes com seu conteúdo no TabNews.',
      }}>
      <NotificationsProvider {...notificationConfig}>
        <div>
          <h1>Notifications</h1>
          {/* The list is already connected to the provider */}
          <NotificationList />
        </div>
      </NotificationsProvider>
    </DefaultLayout>
  );
}
