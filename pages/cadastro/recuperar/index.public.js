import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout, useUser } from 'pages/interface/index.js';
import { FormControl, Box, Heading, Button, TextInput, Flash } from '@primer/react';

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
      userInputRef.current.value = user.username;
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

        <FormControl id="username">
          <FormControl.Label>Digite seu usuário ou e-mail</FormControl.Label>
          <TextInput
            ref={userInputRef}
            onChange={clearErrors}
            name="userInput"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            block={true}
            aria-label="Seu usuário ou e-mail"
          />
          {['userInput', 'email', 'username'].includes(errorObject?.key) && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          {errorObject?.type === 'string.alphanum' && (
            <FormControl.Caption>Dica: use somente letras e números, por exemplo: nomeSobrenome4 </FormControl.Caption>
          )}
        </FormControl>
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
