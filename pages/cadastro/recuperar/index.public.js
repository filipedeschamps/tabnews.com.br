import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { Box, Button, DefaultLayout, Flash, FormControl, Heading, TextInput } from '@/TabNewsUI';
import { useUser } from 'pages/interface';

export default function RecoverPassword() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Recuperação de senha' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Recuperação de senha
      </Heading>

      <RecoverPasswordForm />
    </DefaultLayout>
  );
}

function RecoverPasswordForm() {
  const router = useRouter();
  const { user, isLoading: userIsLoading } = useUser();

  const userInputRef = useRef('');

  useEffect(() => {
    if (user && !userIsLoading) {
      userInputRef.current.value = user.email;
    }
  }, [user, userIsLoading]);

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);

  function clearErrors() {
    setErrorObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    let email;
    let username;
    const userInput = userInputRef.current.value;

    if (!userInput) {
      setErrorObject({
        key: 'userInput',
        message: 'Campo obrigatório',
      });
      return;
    }

    if (userInput.includes('@')) {
      email = userInput;
    } else {
      username = userInput;
    }
    setIsLoading(true);
    setErrorObject(undefined);

    try {
      const response = await fetch(`/api/v1/recovery`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
        }),
      });

      setGlobalErrorMessage(undefined);
      const responseBody = await response.json();

      if (response.status === 201) {
        router.push('/cadastro/recuperar/confirmar');
        return;
      }

      if (response.status === 400) {
        setErrorObject(responseBody);
        setIsLoading(false);
        return;
      }

      if (response.status >= 401) {
        setGlobalErrorMessage(`${responseBody.message} ${responseBody.action} (${responseBody.error_id})`);
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

        {user?.features.includes('create:recovery_token:username') && (
          <Flash variant="default">
            Você pode ajudar outra pessoa a recuperar sua senha, é só digitar o nome de usuário dela.
          </Flash>
        )}

        {user?.features.includes('create:recovery_token:username') && (
          <FormControl id="userInput">
            <FormControl.Label>Digite seu e-mail ou o nome de usuário da pessoa que deseja ajudar</FormControl.Label>
            <TextInput
              contrast
              sx={{ px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
              ref={userInputRef}
              onChange={clearErrors}
              name="userInput"
              size="large"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              block={true}
              aria-label="Digite seu e-mail ou o nome de usuário de outra pessoa"
            />
            {['userInput', 'email', 'username'].includes(errorObject?.key) && (
              <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
            )}

            {errorObject?.type === 'string.alphanum' && (
              <FormControl.Caption>
                Dica: use somente letras e números, por exemplo: nomeSobrenome4{' '}
              </FormControl.Caption>
            )}
          </FormControl>
        )}

        {!user?.features.includes('create:recovery_token:username') && (
          <FormControl id="userInput">
            <FormControl.Label>Digite seu e-mail</FormControl.Label>
            <TextInput
              contrast
              sx={{ minHeight: '46px', px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
              ref={userInputRef}
              onChange={clearErrors}
              name="userInput"
              size="large"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              block={true}
              aria-label="Seu e-mail"
            />
            {['userInput', 'email', 'username'].includes(errorObject?.key) && (
              <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
            )}

            {errorObject?.type === 'string.alphanum' && (
              <FormControl.Validation variant="error">"email" deve conter um endereço válido.</FormControl.Validation>
            )}
          </FormControl>
        )}

        <FormControl>
          <FormControl.Label visuallyHidden>Recuperar</FormControl.Label>
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
            sx={{ width: '100%' }}
            aria-label="Recuperar">
            Recuperar
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}
