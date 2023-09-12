import { useRouter } from 'next/router';
import { getStaticPropsRevalidate } from 'next-swr';
import { useState } from 'react';
import useSWR from 'swr';

import {
  ActionList,
  ActionMenu,
  Box,
  ContentList,
  DefaultLayout,
  Flash,
  IconButton,
  Label,
  LabelGroup,
  Pagehead,
  useConfirm,
  Viewer,
} from '@/TabNewsUI';
import { FaUser, KebabHorizontalIcon, TrashIcon } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function Home({ contentListFound, pagination, userFound: userFoundFallback }) {
  const { data: userFound, mutate: userFoundMutate } = useSWR(`/api/v1/users/${userFoundFallback.username}`, {
    fallbackData: userFoundFallback,
    revalidateOnMount: false,
  });

  const { user, isLoading } = useUser();
  const { push } = useRouter();
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
        <Box sx={{ position: 'absolute', right: 0, top: 2 }}>
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

  return (
    <>
      <DefaultLayout metadata={{ title: `${userFound.username}` }}>
        {globalErrorMessage && (
          <Flash variant="danger" sx={{ width: '100%', mb: 4 }}>
            {globalErrorMessage}
          </Flash>
        )}

        <Box sx={{ width: '100%', display: 'flex' }}>
          <Pagehead as="h1" sx={{ width: '100%', mt: 0, pt: 0, pb: 3, mb: 3 }}>
            {userFound.username} <UserFeatures />
          </Pagehead>
          {user?.features?.includes('ban:user') && OptionsMenu()}
        </Box>

        {userFound.description && (
          <Box
            sx={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'border.default',
              borderRadius: '6px',
              width: '100%',
              p: 3,
              mb: 3,
            }}>
            <Viewer value={userFound.description} />
          </Box>
        )}

        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath={`/${userFound.username}/pagina`}
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
      </DefaultLayout>
    </>
  );
}

export async function getStaticPaths() {
  const relevantResults = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: 1,
    per_page: 100,
  });

  const paths = relevantResults.rows.map((content) => {
    return {
      params: {
        username: content.owner_username,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
}

export const getStaticProps = getStaticPropsRevalidate(async (context) => {
  const userTryingToGet = user.createAnonymous();

  try {
    context.params = validator(context.params, {
      username: 'required',
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  let results;
  let secureUserFound;

  try {
    const userFound = await user.findOneByUsername(context.params.username);

    secureUserFound = authorization.filterOutput(userTryingToGet, 'read:user', userFound);

    results = await content.findWithStrategy({
      strategy: 'new',
      where: {
        owner_id: secureUserFound.id,
        status: 'published',
      },
      page: context.params.page,
      per_page: context.params.per_page,
    });
  } catch (error) {
    // `user` model will throw a `NotFoundError` if the user is not found.
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
        revalidate: 1,
      };
    }

    throw error;
  }

  const contentListFound = results.rows;

  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  for (const content of secureContentListFound) {
    if (content.parent_id) {
      content.body = removeMarkdown(content.body, { maxLength: 255 });
    } else {
      delete content.body;
    }
  }

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentListFound)),
      pagination: results.pagination,
      userFound: JSON.parse(JSON.stringify(secureUserFound)),
    },

    revalidate: 10,
  };
});
