import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout, useUser, Link } from 'pages/interface/index.js';
import { FormControl, Box, Heading, Button, TextInput, Checkbox, Flash, useConfirm } from '@primer/react';

import { suggestEmailFix } from '@/plugins/packs/app-utils';

export default function EditProfile() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Editar Perfil' }}>
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

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [emailDisabled, setEmailDisabled] = useState(false);

  function clearErrors() {
    setErrorObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const notifications = notificationsRef.current.checked;

    setIsLoading(true);
    setErrorObject(undefined);

    const suggestedEmail = suggestEmailFix(email);

    if (suggestedEmail) {
      setErrorObject({
        suggestion: suggestedEmail,
        key: 'email',
        type: 'typo',
      });

      setIsLoading(false);
      return;
    }

    const payload = {};

    if (user.username !== username) {
      const confirmChangeUsername = await confirm({
        title: `Você realmente deseja alterar seu nome de usuário?`,
        content: `Isto irá quebrar todas as URLs das suas publicações.`,
      });

      if (!confirmChangeUsername) {
        setIsLoading(false);
        return;
      }

      payload.username = username;
    }

    if (user.email !== email) {
      payload.email = email;
    }

    if (user.notifications !== notifications) {
      payload.notifications = notifications;
    }

    if (Object.keys(payload).length === 0) {
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

      setGlobalErrorMessage(undefined);

      const responseBody = await response.json();

      if (response.status === 200) {
        await fetchUser();

        if (user.email !== email) {
          setErrorObject({
            message: `Atenção: Um email de confirmação foi enviado para ${email}`,
            key: 'email',
            type: 'confirmation',
          });
          setEmailDisabled(true);
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
        setGlobalErrorMessage(`${responseBody.message} Informe ao suporte este valor: ${responseBody.error_id}`);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setGlobalErrorMessage('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.');
      setIsLoading(false);
    }
  }

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {globalErrorMessage && <Flash variant="danger">{globalErrorMessage}</Flash>}

        <FormControl id="username">
          <FormControl.Label>Nome de usuário</FormControl.Label>
          <TextInput
            ref={usernameRef}
            onChange={clearErrors}
            name="username"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            block={true}
            aria-label="Seu nome de usuário"
          />
          {errorObject?.key === 'username' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          {errorObject?.type === 'string.alphanum' && (
            <FormControl.Caption>Dica: use somente letras e números, por exemplo: nomeSobrenome4 </FormControl.Caption>
          )}
        </FormControl>

        <FormControl id="email" disabled={emailDisabled}>
          <FormControl.Label>Email</FormControl.Label>
          <TextInput
            ref={emailRef}
            onChange={clearErrors}
            name="email"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            block={true}
            aria-label="Seu email"
          />
          {errorObject?.key === 'email' && !errorObject?.type && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
          {errorObject?.key === 'email' && errorObject?.type === 'typo' && (
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
                      clearErrors();
                      emailRef.current.value = errorObject.suggestion;
                      passwordRef.current.focus();
                    }}>
                    {errorObject.suggestion.split('@')[0]}@<u>{errorObject.suggestion.split('@')[1]}</u>
                  </Button>
                </Box>
              </Box>
            </FormControl.Validation>
          )}

          {errorObject?.key === 'email' && errorObject?.type === 'confirmation' && (
            <FormControl.Validation variant="warning">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>

        <FormControl id="notifications">
          <FormControl.Label>Receber notificações por email</FormControl.Label>

          <Checkbox
            ref={notificationsRef}
            onChange={clearErrors}
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

        <FormControl>
          <FormControl.Label visuallyHidden>Salvar</FormControl.Label>
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
            sx={{ width: '100%' }}
            aria-label="Salvar">
            Salvar
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}
