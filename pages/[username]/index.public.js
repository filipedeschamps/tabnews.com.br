import { getStaticPropsRevalidate } from 'next-swr';
import { useState } from 'react';
import useSWR from 'swr';

import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  ButtonWithLoader,
  CharacterCount,
  DefaultLayout,
  Editor,
  Flash,
  FormControl,
  IconButton,
  Label,
  LabelGroup,
  NavItem,
  NavList,
  PastTime,
  TabCashCount,
  TabCoinCount,
  Text,
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
import { createErrorMessage, useUser } from 'pages/interface';

export default function Page({ userFound: userFoundFallback }) {
  const {
    data: { body: userFound },
    mutate: userFoundMutate,
  } = useSWR(`/api/v1/users/${userFoundFallback.username}`, {
    fallbackData: { body: userFoundFallback },
    revalidateOnMount: false,
  });

  function onUpdate(updatedUser) {
    userFoundMutate({ body: updatedUser }, { revalidate: false });
  }

  return (
    <DefaultLayout metadata={{ title: `${userFound.username}` }}>
      <UserProfile key={userFound.id} userFound={userFound} onUpdate={onUpdate} />
    </DefaultLayout>
  );
}

const DESCRIPTION_MAX_LENGTH = 5_000;

function UserProfile({ userFound, onUpdate }) {
  const { user } = useUser();
  const [globalMessageObject, setGlobalMessageObject] = useState(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const isAuthenticatedUser = user && user.username === userFound.username;
  const canUpdate = isAuthenticatedUser && user?.features?.includes('update:user');
  const canUpdateDescription = canUpdate || user?.features?.includes('update:user:others');

  function handleEditDescription() {
    setGlobalMessageObject(null);
    setIsEditingDescription(true);
  }

  function handleEditSuccess(newUser) {
    setIsEditingDescription(false);
    onUpdate(newUser);
  }

  return (
    <>
      {globalMessageObject?.position === 'main' && (
        <Flash variant={globalMessageObject.type} sx={{ width: '100%', mb: 4 }}>
          {globalMessageObject.text}
        </Flash>
      )}

      <UserHeader username={userFound.username}>
        <UserFeatures userFound={userFound} />
        <OptionsMenu
          canUpdate={canUpdate}
          isAuthenticatedUser={isAuthenticatedUser}
          onNuke={onUpdate}
          setGlobalMessageObject={setGlobalMessageObject}
          user={user}
          userFound={userFound}
        />
      </UserHeader>

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'end',
          wordBreak: 'break-word',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}>
        <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {userFound.tabcoins !== undefined && <TabCoinCount amount={userFound.tabcoins} mode="full" />}

          {userFound.tabcash !== undefined && <TabCashCount amount={userFound.tabcash} mode="full" />}

          <Box sx={{ ml: 1 }}>
            <PastTime date={userFound.created_at} formatText={(date) => `Membro há ${date}`} direction="ne" />
          </Box>
        </Box>
      </Box>

      {userFound.description && !isEditingDescription && (
        <>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              mb: 1,
              minHeight: '32px', // This is the button height, so it doesn't flick when the button is rendered
            }}>
            <Text sx={{ fontSize: 1, fontWeight: 'bold', mt: 'auto', pb: 1 }}>Descrição</Text>
            {canUpdateDescription && (
              <Button variant="invisible" sx={{ color: 'accent.fg' }} onClick={handleEditDescription}>
                Editar descrição
              </Button>
            )}
          </Box>

          <Box
            sx={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'border.default',
              borderRadius: 2,
              width: '100%',
              p: 3,
              overflow: 'hidden',
            }}>
            <Viewer value={userFound.description} clobberPrefix={`${userFound.username}-content-`} />
          </Box>
        </>
      )}

      {!userFound.description && canUpdateDescription && !isEditingDescription && (
        <Button sx={{ mx: 'auto', mt: 1 }} onClick={handleEditDescription}>
          Criar descrição
        </Button>
      )}

      {isEditingDescription && (
        <DescriptionForm
          user={userFound}
          onCancel={() => setIsEditingDescription(false)}
          onSuccess={handleEditSuccess}
          globalMessageObject={globalMessageObject}
          setGlobalMessageObject={setGlobalMessageObject}
          isAuthenticatedUser={isAuthenticatedUser}
        />
      )}

      {!isEditingDescription && globalMessageObject?.position === 'description' && (
        <Flash variant={globalMessageObject.type} sx={{ width: '100%', mt: 3 }}>
          {globalMessageObject.text}
        </Flash>
      )}
    </>
  );
}

function DescriptionForm({
  user,
  onCancel,
  onSuccess,
  globalMessageObject,
  setGlobalMessageObject,
  isAuthenticatedUser,
}) {
  const [description, setDescription] = useState(user.description ?? '');
  const [isPosting, setIsPosting] = useState(false);
  const [errorObject, setErrorObject] = useState();

  const confirm = useConfirm();

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (user.description === description) {
      setGlobalMessageObject({
        type: 'warning',
        position: 'description',
        text: 'A descrição não foi alterada.',
      });
      return;
    }

    const confirmSubmit = !isAuthenticatedUser
      ? await confirm({
          title: 'Tem certeza que deseja salvar as alterações?',
          content: (
            <Text>
              Você está editando a descrição do usuário &quot;<Text sx={{ fontWeight: 'bold' }}>{user.username}</Text>
              &quot;.
            </Text>
          ),
          cancelButtonContent: 'Cancelar',
          confirmButtonContent: 'Sim',
        })
      : true;

    if (!confirmSubmit) return;

    setIsPosting(true);

    try {
      const response = await fetch(`/api/v1/users/${user.username}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description }),
      });

      const responseBody = await response.json();

      if (response.status === 200) {
        setGlobalMessageObject({
          type: 'success',
          position: 'description',
          text: 'Descrição salva com sucesso!',
        });
        onSuccess(responseBody);
        return;
      }

      if (response.status === 400) {
        setErrorObject(responseBody);
        return;
      }

      if (response.status >= 403) {
        setGlobalMessageObject({
          type: 'danger',
          position: 'description',
          text: createErrorMessage(responseBody),
        });
      }
    } catch (error) {
      setGlobalMessageObject({
        type: 'danger',
        position: 'description',
        text: 'Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.',
      });
    } finally {
      setIsPosting(false);
    }
  }

  async function handleCancel() {
    const confirmCancel =
      description !== user.description
        ? await confirm({
            title: 'Tem certeza que deseja sair da edição?',
            content: 'A alteração não foi salva e será perdida.',
            cancelButtonContent: 'Cancelar',
            confirmButtonContent: 'Sim',
          })
        : true;

    if (!confirmCancel) return;

    clearMessages();
    onCancel();
  }

  function handleDescriptionChange(value) {
    setDescription(value);
    clearMessages();
  }

  function clearMessages() {
    setErrorObject(undefined);
    setGlobalMessageObject(null);
  }

  function handleKeyDown(event) {
    if (isPosting) return;
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit(event);
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }

  return (
    <Box as="form" sx={{ width: '100%' }} onSubmit={handleSubmit}>
      <FormControl id="description">
        {/* Label styled similar to the "read" view so it is in the same position */}
        <FormControl.Label sx={{ display: 'flex', alignItems: 'flex-end', pb: 1, minHeight: '32px' }}>
          Descrição
        </FormControl.Label>
        <Editor
          isInvalid={errorObject?.key === 'description' || description.length > DESCRIPTION_MAX_LENGTH}
          value={description}
          onChange={handleDescriptionChange}
          onKeyDown={handleKeyDown}
          clobberPrefix={`${user.username}-content-`}
        />

        <Box sx={{ display: 'flex', width: '100%' }}>
          {errorObject?.key === 'description' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          <CharacterCount maxLength={DESCRIPTION_MAX_LENGTH} value={description} />
        </Box>
      </FormControl>

      {globalMessageObject?.position === 'description' && (
        <Flash variant={globalMessageObject.type} sx={{ mt: 3 }}>
          {globalMessageObject.text}
        </Flash>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, mt: 3 }}>
        <Button
          variant="invisible"
          type="button"
          disabled={isPosting}
          sx={{ fontWeight: 'normal', color: 'fg.muted' }}
          aria-label="Cancelar alteração"
          onClick={handleCancel}>
          Cancelar
        </Button>

        <ButtonWithLoader variant="primary" type="submit" aria-label="Salvar" isLoading={isPosting}>
          Salvar
        </ButtonWithLoader>
      </Box>
    </Box>
  );
}

function UserFeatures({ userFound }) {
  if (!userFound?.features?.length) return null;

  return (
    <LabelGroup sx={{ display: 'flex', alignSelf: 'center' }}>
      {userFound.features.includes('nuked') && <Label variant="danger">nuked</Label>}
    </LabelGroup>
  );
}

function OptionsMenu({ canUpdate, isAuthenticatedUser, onNuke, setGlobalMessageObject, user, userFound }) {
  const confirm = useConfirm();

  async function handleNuke() {
    setGlobalMessageObject(null);

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
      onNuke(responseBody);
      return;
    }

    setGlobalMessageObject({
      type: 'danger',
      position: 'main',
      text: createErrorMessage(responseBody),
    });
  }

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
            <ActionList.Item variant="danger" onSelect={handleNuke}>
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
