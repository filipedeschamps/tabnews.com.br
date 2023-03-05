import useSWR from 'swr';
import { useState } from 'react';
import { DefaultLayout, ContentList, useUser, Link } from 'pages/interface/index.js';
import { FaUser } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { Box, Pagehead, ActionMenu, ActionList, Flash, IconButton, useConfirm, LabelGroup, Label } from '@primer/react';
import { KebabHorizontalIcon, TrashIcon } from '@primer/octicons-react';

export default function Home({ contentListFound, pagination, userFound: userFoundFallback, bookmarksFound }) {
  const { data: userFound, mutate: userFoundMutate } = useSWR(`/api/v1/users/${userFoundFallback.username}`, {
    fallbackData: userFoundFallback,
    revalidateOnMount: true,
  });

  const { user, isLoading } = useUser();
  const { push, asPath } = useRouter();
  const confirm = useConfirm();
  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);

  const isAuthenticatedUser = user && user.username === userFound.username;

  async function handleClickNuke() {
    setGlobalErrorMessage(null);

    const confirmDelete1 = await confirm({
      title: `Atenção: Você está realizando um Nuke!`,
      content: `Deseja banir o usuário "${userFound.username}" e desfazer todas as suas ações?`,
      confirmButtonContent: 'Sim',
      cancelButtonContent: 'Cancelar',
    });

    if (!confirmDelete1) return;

    // Fake delay to avoid multiple accidental clicks
    await new Promise((r) => setTimeout(r, 1000));

    const confirmDelete2 = await confirm({
      title: `Nuke em "${userFound.username}"`,
      content: `Confirme novamente esta operação.`,
    });

    if (!confirmDelete2) return;

    const payload = {
      ban_type: 'nuke',
    };

    const response = await fetch(`/api/v1/users/${userFound.username}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();

    if (response.status === 200) {
      userFoundMutate(responseBody);
      return;
    }

    setGlobalErrorMessage(`${responseBody.message} ${responseBody.action}`);
    return;
  }

  function OptionsMenu() {
    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'absolute', right: 0 }}>
          <ActionMenu>
            <ActionMenu.Anchor>
              <IconButton size="small" icon={KebabHorizontalIcon} aria-label="Editar usuário" />
            </ActionMenu.Anchor>

            <ActionMenu.Overlay>
              <ActionList>
                {!userFound?.features?.includes('nuked') && (
                  <ActionList.Item variant="danger" onClick={handleClickNuke}>
                    <ActionList.LeadingVisual>
                      <TrashIcon />
                    </ActionList.LeadingVisual>
                    Nuke
                  </ActionList.Item>
                )}
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </Box>
      </Box>
    );
  }

  function UserFeatures() {
    if (!userFound?.features?.length) return null;

    return (
      <LabelGroup sx={{ display: 'flex', ml: 2 }}>
        {userFound.features.includes('nuked') && <Label variant="danger">nuked</Label>}
      </LabelGroup>
    );
  }

  function NavigationBar() {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '1rem', margin: '0 24px 0 24px' }}>
        <Link
          href={`/${userFound.username}`}
          prefetch={true}
          style={{
            fontWeight: 600,
            color: '#24292f',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            borderBottom: asPath.endsWith(`/${userFound.username}`) ? '2px solid #24292f' : 'none',
          }}>
          Conteúdos
        </Link>

        <Link
          href={`/${userFound.username}/marcadores`}
          prefetch={true}
          style={{
            fontWeight: 600,
            color: '#24292f',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            borderBottom: 'none',
            borderBottom: asPath.endsWith(`/marcadores`) ? '2px solid #24292f' : 'none',
          }}>
          Marcadores
        </Link>
      </Box>
    );
  }

  return (
    <>
      <DefaultLayout metadata={{ title: `${userFound.username}` }}>
        {globalErrorMessage && (
          <Flash variant="danger" sx={{ width: '100%', mb: 4 }}>
            {globalErrorMessage}
          </Flash>
        )}

        <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start' }}>
          <Pagehead as="h1" sx={{ width: '100%', mt: 0, pt: 0, pb: 3, display: 'flex', alignItems: 'center' }}>
            {userFound.username} <UserFeatures />
          </Pagehead>
          {user?.features?.includes('ban:user') && OptionsMenu()}
        </Box>
        <div style={{ width: '100%' }}>
          <NavigationBar />
          {asPath.endsWith(`/${userFound.username}`) && (
            <ContentList
              contentList={contentListFound}
              pagination={pagination}
              paginationBasePath={`/${userFound.username}/pagina`}
              revalidatePath={`/api/v1/contents/${userFound.username}?strategy=new`}
              emptyStateProps={{
                isLoading: isLoading,
                title: 'Nenhum conteúdo encontrado',
                description: `${isAuthenticatedUser ? 'Você' : userFound.username} ainda não fez nenhuma publicação.`,
                icon: FaUser,
                action: isAuthenticatedUser && {
                  text: 'Publicar conteúdo',
                  onClick: () => push('/publicar'),
                },
              }}
            />
          )}
          {asPath.endsWith(`/marcadores`) && (
            <ContentList
              contentList={bookmarksFound}
              revalidatePath={`/api/v1/bookmarks/${userFound.username}`}
              emptyStateProps={{
                isLoading: isLoading,
                title: 'Nenhum marcador encontrado',
                description: `${isAuthenticatedUser ? 'Você' : userFound.username} ainda não fez nenhuma marcação.`,
                icon: FaUser,
                action: isAuthenticatedUser && {
                  text: 'Salve algum conteúdo',
                  onClick: () => push('/'),
                },
              }}
            />
          )}
        </div>
      </DefaultLayout>
    </>
  );
}
