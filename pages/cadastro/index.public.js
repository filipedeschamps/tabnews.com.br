import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout } from 'pages/interface/index.js';
import { FormControl, Box, Heading, Button, TextInput, Flash } from '@primer/react';

export default function Register() {
  return (
    <DefaultLayout>
      <Box sx={{ padding: [3, null, null, 4] }}>
        <Box
          sx={{
            maxWidth: '400px',
            marginX: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
          }}>
          <SignUpForm />
        </Box>
      </Box>
    </DefaultLayout>
  );
}

function SignUpForm() {
  const router = useRouter();

  const usernameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);

  function clearErrors() {
    setErrorObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    setIsLoading(true);
    setErrorObject(undefined);

    try {
      const response = await fetch(`/api/v1/users`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      setGlobalErrorMessage(undefined);

      const responseBody = await response.json();

      if (response.status === 400) {
        setErrorObject(responseBody);
        return;
      }

      if (response.status >= 500) {
        setGlobalErrorMessage(`${responseBody.message} Informe ao suporte este valor: ${responseBody.error_id}`);
        return;
      }

      localStorage.setItem('registrationEmail', email);
      router.push('/cadastro/confirmar');
    } catch (error) {
      setGlobalErrorMessage('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit}>
      <Box display="grid" width="100%" gridGap={3}>
        {globalErrorMessage && <Flash variant="danger">{globalErrorMessage}</Flash>}

        <Box>
          <Heading as="h1">Cadastro</Heading>
        </Box>
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
            aria-label="Seu nome de usuário"
          />
          {errorObject?.key === 'username' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          {errorObject?.type === 'string.alphanum' && (
            <FormControl.Caption>Dica: use somente letras e números, por exemplo: nomeSobrenome4 </FormControl.Caption>
          )}
        </FormControl>
        <FormControl id="email">
          <FormControl.Label>Email</FormControl.Label>
          <TextInput
            ref={emailRef}
            onChange={clearErrors}
            name="email"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Seu email"
          />
          {errorObject?.key === 'email' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>
        <FormControl id="password">
          <FormControl.Label>Senha</FormControl.Label>
          <TextInput
            ref={passwordRef}
            onChange={clearErrors}
            name="password"
            type="password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            size="large"
            aria-label="Sua senha"
          />
          {errorObject?.key === 'password' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label visuallyHidden>Criar cadastro</FormControl.Label>
          <Button variant="primary" size="large" type="submit" disabled={isLoading} aria-label="Criar cadastro">
            Criar cadastro
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}
