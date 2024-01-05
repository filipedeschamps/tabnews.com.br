import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import {
  Box,
  Button,
  ButtonWithLoader,
  Checkbox,
  DefaultLayout,
  Editor,
  Flash,
  FormControl,
  Heading,
  Link,
  Text,
  TextInput,
  useConfirm,
} from '@/TabNewsUI';
import { suggestEmail, useUser } from 'pages/interface';

export default function EditProfile() {
  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Editar Perfil' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Editar Perfil
      </Heading>
      <EditProfileForm />
    </DefaultLayout>
  );
}

function EditProfileForm() {
  const router = useRouter();
  const confirm = useConfirm();

  const { user, fetchUser, isLoading: userIsLoading } = useUser();

  const usernameRef = useRef('');
  const emailRef = useRef('');
  const notificationsRef = useRef('');

  useEffect(() => {
    if (router && !user && !userIsLoading) {
      router.push(`/login?redirect=${router.asPath}`);
    }

    if (user && !userIsLoading) {
      usernameRef.current.value = user.username;
      emailRef.current.value = user.email;
      notificationsRef.current.checked = user.notifications;
    }
  }, [user, router, userIsLoading]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const [globalMessageObject, setGlobalMessageObject] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [emailDisabled, setEmailDisabled] = useState(false);
  const [description, setDescription] = useState(user?.description || '');

  function clearMessages() {
    setErrorObject(undefined);
    setGlobalMessageObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const notifications = notificationsRef.current.checked;

    setIsLoading(true);
    setErrorObject(undefined);

    const payload = {};

    if (user.username !== username) {
      const confirmChangeUsername = await confirm({
        title: `Você realmente deseja alterar seu nome de usuário?`,
        content: `Isto irá quebrar todas as URLs das suas publicações.`,
        cancelButtonContent: 'Cancelar',
        confirmButtonContent: 'Sim',
      });

      if (!confirmChangeUsername) {
        setIsLoading(false);
        return;
      }

      payload.username = username;
    }

    if (user.email !== email) {
      const suggestedEmail = suggestEmail(email);

      if (suggestedEmail) {
        setErrorObject({
          suggestion: suggestedEmail,
          key: 'email',
          type: 'typo',
        });

        setIsLoading(false);
        return;
      }

      payload.email = email;
    }

    if (user.description !== description) {
      payload.description = description;
    }

    if (user.notifications !== notifications) {
      payload.notifications = notifications;
    }

    if (Object.keys(payload).length === 0) {
      setGlobalMessageObject({
        type: 'warning',
        text: 'Nenhuma configuração foi alterada',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${user.username}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json();

      if (response.status === 200) {
        await fetchUser();

        if (user.email !== email) {
          const hasSavedModifications = Object.keys(payload).length > 1;
          const text = hasSavedModifications
            ? `Alterações salvas. O email será alterado apenas após a confirmação pelo link enviado para "${email}".`
            : `Alteração pendente. Um email de confirmação foi enviado para "${email}".`;
          setGlobalMessageObject({ text, type: 'warning' });
          setEmailDisabled(true);
        } else {
          setGlobalMessageObject({
            type: 'success',
            text: 'Salvo com sucesso!',
          });
        }

        setIsLoading(false);
        return;
      }

      if (response.status === 400) {
        setErrorObject(responseBody);
        setIsLoading(false);
        return;
      }

      if (response.status >= 403) {
        setGlobalMessageObject({
          type: 'danger',
          text: `${responseBody.message} Informe ao suporte este valor: ${responseBody.error_id}`,
        });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setGlobalMessageObject({
        type: 'danger',
        text: 'Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.',
      });
      setIsLoading(false);
    }
  }

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit} onChange={clearMessages}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl id="username" required>
          <FormControl.Label>Nome de usuário</FormControl.Label>
          <TextInput
            ref={usernameRef}
            name="username"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            block={true}
            aria-label="Seu nome de usuário"
            contrast
            sx={{ minHeight: '46px', px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
          />
          {errorObject?.key === 'username' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          {errorObject?.type === 'string.alphanum' && (
            <FormControl.Caption>Dica: use somente letras e números, por exemplo: nomeSobrenome4 </FormControl.Caption>
          )}
        </FormControl>

        <FormControl id="email" disabled={emailDisabled} required>
          <FormControl.Label>Email</FormControl.Label>
          <TextInput
            ref={emailRef}
            name="email"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            block={true}
            aria-label="Seu email"
            contrast
            sx={{ minHeight: '46px', px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
          />
          {errorObject?.key === 'email' && errorObject.type !== 'typo' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
          {errorObject?.key === 'email' && errorObject.type === 'typo' && (
            <FormControl.Validation variant="error">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box>Você quis dizer:</Box>
                <Box>
                  <Button
                    variant="invisible"
                    size="small"
                    sx={{ p: 1 }}
                    onClick={(event) => {
                      event.preventDefault();
                      clearMessages();
                      emailRef.current.value = errorObject.suggestion;
                    }}>
                    {errorObject.suggestion.split('@')[0]}@<u>{errorObject.suggestion.split('@')[1]}</u>
                  </Button>
                </Box>
              </Box>
            </FormControl.Validation>
          )}
        </FormControl>

        <FormControl id="description">
          <FormControl.Label>Descrição</FormControl.Label>

          <Editor
            onChange={(value) => {
              clearMessages();
              setDescription(value);
            }}
            value={description}
            isValid={errorObject?.key === 'description'}
            compact={true}
          />

          {errorObject?.key === 'description' && errorObject.type === 'string.max' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>

        <FormControl id="notifications" sx={{ gap: 2, alignItems: 'center' }}>
          <FormControl.Label>Receber notificações por email</FormControl.Label>

          <Checkbox
            sx={{ display: 'flex' }}
            ref={notificationsRef}
            name="notifications"
            aria-label="Você deseja receber notificações?"
          />

          {errorObject?.key === 'notifications' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>

        <FormControl id="password">
          <FormControl.Label>Senha</FormControl.Label>
          <Link href="/cadastro/recuperar" sx={{ fontSize: 0 }}>
            Utilize o fluxo de recuperação de senha →
          </Link>
        </FormControl>

        <Text sx={{ fontSize: 1 }}>Os campos marcados com um asterisco (*) são obrigatórios.</Text>

        {globalMessageObject && <Flash variant={globalMessageObject.type}>{globalMessageObject.text}</Flash>}

        <FormControl>
          <FormControl.Label visuallyHidden>Salvar</FormControl.Label>
          <ButtonWithLoader
            variant="primary"
            size="large"
            type="submit"
            sx={{ width: '100%' }}
            aria-label="Salvar"
            isLoading={isLoading}>
            Salvar
          </ButtonWithLoader>
        </FormControl>
      </Box>
    </form>
  );
}
