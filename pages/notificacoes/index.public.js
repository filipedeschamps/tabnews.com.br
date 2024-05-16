import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  Blankslate,
  Box,
  Button,
  CustomPaginationTable,
  DataTable,
  DefaultLayout,
  Heading,
  Label,
  Link,
  RelativeTime,
  Table,
  useConfirm,
} from '@/TabNewsUI';
import { BellSlashIcon } from '@/TabNewsUI/icons';
import { useNotifications, useUser } from 'pages/interface';

export default function Notifications() {
  const router = useRouter();

  const {
    notifications,
    getAllNotifications,
    isLoading,
    readAllNotifications,
    readNotification,
    deleteAllNotifications,
  } = useNotifications();

  const { user, isLoading: userIsLoading } = useUser();

  const confirm = useConfirm();

  const [pageIndex, setPageIndex] = useState(0);
  const [rows, setRows] = useState([]);
  const [data, setData] = useState([]);
  const [showContent, setShowContent] = useState(false);
  const [showButtonReadAll, setShowButtonReadAll] = useState(false);

  const pageSize = 10;
  const start = pageIndex * pageSize;
  const end = start + pageSize;

  useEffect(() => {
    if (router && !user && !userIsLoading) {
      router.push(`/login?redirect=${router.asPath}`);
    }
  }, [user, router, userIsLoading]);

  useEffect(() => {
    if (!isLoading && notifications) {
      setData(notifications);
      setShowButtonReadAll(notifications.filter((notification) => notification.status === 'unread').length);
      setRows(notifications.slice(start, end));
      setShowContent(true);
    }
  }, [end, start, isLoading, notifications]);

  useEffect(() => {
    getAllNotifications();
  }, [getAllNotifications]);

  const handleReadAll = async () => {
    const response = await readAllNotifications();

    if (response && response.status === 200) {
      getAllNotifications();
      setShowButtonReadAll(false);

      return;
    }
  };

  const handleRead = async (notificationId, status) => {
    if (status === 'unread') {
      const response = await readNotification(notificationId);

      if (response && response.status === 200) {
        getAllNotifications();

        return;
      }
    }
  };

  const handleDeleteAll = async () => {
    const confirmDelete = await confirm({
      title: 'Você tem certeza?',
      content: 'Deseja realmente apagar todas as notificações?',
      cancelButtonContent: 'Cancelar',
      confirmButtonContent: 'Sim',
    });

    if (!confirmDelete) return;

    const response = await deleteAllNotifications();

    if (response && response.status === 200) {
      getAllNotifications();
      setRows([]);
      setData([]);
      return;
    }
  };

  const handleRefresh = () => {
    return window.location.reload();
  };

  const columns = [
    {
      header: 'Notificação',
      field: 'title',
      rowHeader: true,
      renderCell: (row) => {
        return (
          <Link
            sx={{
              color: row.status == 'read' ? 'fg.subtle' : 'fg.default',
            }}
            href={row.content_link}
            onClick={() => handleRead(row.id, row.status)}>
            {row.body_reply_line}
          </Link>
        );
      },
    },
    {
      header: 'Tipo',
      field: 'type',
      renderCell: (row) => {
        return <Label>{row.type === 'post' ? 'Publicação' : 'Comentário'}</Label>;
      },
    },
    {
      header: 'Status',
      field: 'status',
      renderCell: (row) => {
        return <Label>{row.status === 'unread' ? 'Não lido' : 'Lido'}</Label>;
      },
    },
    {
      header: 'Data',
      field: 'createdAt',
      renderCell: (row) => {
        return <RelativeTime date={new Date(row.created_at)} />;
      },
    },
    {
      header: 'Atulizado',
      field: 'updatedAt',
      renderCell: (row) => {
        return <RelativeTime date={new Date(row.updated_at)} />;
      },
    },
  ];

  return (
    <DefaultLayout metadata={{ title: 'Notificações' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Notificações
      </Heading>
      <Box sx={{ width: '100%' }}>
        <Table.Container
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            width: '100%',
          }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Table.Title as="h2" id="notifications">
              Suas notificações
            </Table.Title>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', mt: 2 }}>
              {data && data.length > 0 && !isLoading ? (
                <>
                  <Table.Actions>
                    <Button onClick={handleDeleteAll}>Apagar tudo</Button>
                  </Table.Actions>
                  {showButtonReadAll ? (
                    <Table.Actions>
                      <Button onClick={handleReadAll}>Ler tudo</Button>
                    </Table.Actions>
                  ) : null}
                </>
              ) : null}
              {data && !data.length > 0 && !isLoading && (
                <Table.Actions>
                  <Button onClick={handleRefresh}>Atualizar</Button>
                </Table.Actions>
              )}
            </Box>
          </Box>
          <Table.Divider />
          <Table.Subtitle as="p" id="notifications-subtitle">
            Todas notificações estão abaixo
          </Table.Subtitle>
          {isLoading ? (
            <Table.Skeleton
              aria-labelledby="notifications"
              aria-describedby="notifications-subtitle"
              columns={columns}
              rows={10}
            />
          ) : showContent ? (
            data.length > 0 ? (
              <>
                <DataTable
                  aria-labelledby="notifications"
                  aria-describedby="notifications-subtitle"
                  data={rows}
                  columns={columns}
                  cellPadding="spacious"
                />
                <CustomPaginationTable
                  aria-label="Paginação para Notificações"
                  pageSize={pageSize}
                  totalCount={data.length}
                  onChange={({ pageIndex }) => {
                    setPageIndex(pageIndex);
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'border.muted',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: 5,
                  mt: 2,
                  borderRadius: 2,
                }}>
                <Blankslate.Visual>
                  <BellSlashIcon size="large" />
                </Blankslate.Visual>
                <Heading as="h3" sx={{ fontSize: '1.2rem' }}>
                  Sem notificações
                </Heading>
                <Blankslate.Description>
                  Nenhum notificação encontrada, tente novamente mais tarde!
                </Blankslate.Description>
                <Blankslate.PrimaryAction href="/notificacoes">Atualizar</Blankslate.PrimaryAction>
              </Box>
            )
          ) : (
            <Table.Skeleton
              aria-labelledby="notifications"
              aria-describedby="notifications-subtitle"
              columns={columns}
              rows={10}
            />
          )}
        </Table.Container>
      </Box>
    </DefaultLayout>
  );
}
