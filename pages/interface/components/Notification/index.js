import { Box, Button } from '@primer/react';
import { useState } from 'react';

import { NotificationMenu, NotificationsProvider } from '@/TabNewsUI';
import { useNotificationConfig } from 'pages/interface';

export default function Notifications({ user }) {
  const [options] = useState({ is_page: false, page: 1, per_page: 10 });
  const notificationConfig = useNotificationConfig({ user, options });
  return (
    <NotificationsProvider {...notificationConfig}>
      <header>
        {/* Render the notification menu in the header */}
        <NotificationCenter />
      </header>
    </NotificationsProvider>
  );
}

function NotificationCenter() {
  return (
    <NotificationMenu
      footer={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <Button
            as="a"
            href="/notifications"
            variant="invisible"
            size="small"
            sx={{
              color: 'fg.muted',
              '&:hover': {
                color: 'fg.default',
                bg: 'canvas.subtle',
              },
            }}>
            Ver todas
          </Button>
        </Box>
      }
    />
  );
}
