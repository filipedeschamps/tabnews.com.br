import { getStaticPropsRevalidate } from 'next-swr';
import { useState } from 'react';
import useSWR from 'swr';

import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  DefaultLayout,
  Flash,
  IconButton,
  Label,
  LabelGroup,
  NavItem,
  NavList,
  NextLink,
  PastTime,
  TabCashCount,
  TabCoinCount,
  useConfirm,
  UserHeader,
  Viewer,
} from '@/TabNewsUI';
import { CircleSlashIcon, GearIcon, KebabHorizontalIcon } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function Page({ userFound: userFoundFallback }) {
  const { data: userFound, mutate: userFoundMutate } = useSWR(`/api/v1/users/${userFoundFallback.username}`, {
    fallbackData: userFoundFallback,
    revalidateOnMount: false,
  });

  const { user } = useUser();
  const confirm = useConfirm();
  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);

  const isAuthenticatedUser = user && user.username === userFound.username;
  const canUpdate = isAuthenticatedUser && user?.features?.includes('update:user');

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
    const canNuke =
      !isAuthenticatedUser && user?.features?.includes('ban:user') && !userFound?.features?.includes('nuked');
    if (!canNuke && !canUpdate) {
      return null;
    }

    return (
      <ActionMenu>
        <ActionMenu.Anchor>
          <IconButton
            sx={{ ml: 'auto', px: 1, alignSelf: 'center' }}
            size="small"
            icon={KebabHorizontalIcon}
            aria-label="Editar usuário"
          />
        </ActionMenu.Anchor>
        <ActionMenu.Overlay>
          <ActionList>
            {canUpdate && (
              <NavItem href="/perfil">
                <NavList.LeadingVisual>
                  <GearIcon />
                </NavList.LeadingVisual>
                Editar perfil
              </NavItem>
            )}
            {canNuke && (
              <ActionList.Item variant="danger" onClick={handleClickNuke}>
                <ActionList.LeadingVisual>
                  <CircleSlashIcon />
                </ActionList.LeadingVisual>
                Nuke
              </ActionList.Item>
            )}
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
    );
  }

  function UserFeatures() {
    if (!userFound?.features?.length) return null;

    return (
      <LabelGroup sx={{ display: 'flex', alignSelf: 'center' }}>
        {userFound.features.includes('nuked') && <Label variant="danger">nuked</Label>}
      </LabelGroup>
    );
  }

  return (
    <DefaultLayout metadata={{ title: `${userFound.username}` }}>
      {globalErrorMessage && (
        <Flash variant="danger" sx={{ width: '100%', mb: 4 }}>
          {globalErrorMessage}
        </Flash>
      )}

      <UserHeader username={userFound.username}>
        <UserFeatures />
        <OptionsMenu />
      </UserHeader>

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'end',
          wordBreak: 'break-word',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}>
        <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {userFound.tabcoins !== undefined && <TabCoinCount amount={userFound.tabcoins} mode="full" />}

          {userFound.tabcash !== undefined && <TabCashCount amount={userFound.tabcash} mode="full" />}

          <Box sx={{ ml: 1 }}>
            <PastTime date={userFound.created_at} formatText={(date) => `Membro há ${date}`} direction="ne" />
          </Box>
        </Box>
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
            overflow: 'hidden',
          }}>
          <Viewer value={userFound.description} />
        </Box>
      )}

      {!userFound.description && canUpdate && (
        <Button href="/perfil" as={NextLink} sx={{ mx: 'auto' }}>
          Criar descrição
        </Button>
      )}
    </DefaultLayout>
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

  let secureUserFound;

  try {
    const userFound = await user.findOneByUsername(context.params.username, { withBalance: true });

    secureUserFound = authorization.filterOutput(userTryingToGet, 'read:user', userFound);
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

  return {
    props: {
      userFound: JSON.parse(JSON.stringify(secureUserFound)),
    },

    revalidate: 10,
  };
});
