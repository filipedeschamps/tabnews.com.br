import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout } from 'pages/interface/index.js';
import { FormControl, Box, Heading, Button, TextInput, Flash, Link } from '@primer/react';

export default function Login() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Login' }}>
      <LoginForm />
    </DefaultLayout>
  );
}

function LoginForm() {
  const router = useRouter();

  const emailRef = useRef('');
  const passwordRef = useRef('');

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [capsLockWarnigMessage, setCapsLockWarnigMessage] = useState(false);

  const capsLock = (e) => {
    if (e.getModifierState('CapsLock')) setCapsLockWarnigMessage('CapsLock está ativado.');
    else setCapsLockWarnigMessage(false);
  };

  function clearErrors() {
    setErrorObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    setIsLoading(true);
    setErrorObject(undefined);

    try {
      const response = await fetch(`/api/v1/sessions`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      setGlobalErrorMessage(undefined);

      const responseBody = await response.json();

      if (response.status === 201) {
        router.push('/publicar');
        return;
      }

      if (response.status === 400) {
        setErrorObject(responseBody);
        setIsLoading(false);
        return;
      }

      if (response.status >= 401) {
        setGlobalErrorMessage(`${responseBody.message} ${responseBody.action}`);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setGlobalErrorMessage('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.');
      setIsLoading(false);
    }
  }

  return (
    <>
      <form style={{ width: '100%' }} onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {globalErrorMessage && <Flash variant="danger">{globalErrorMessage}</Flash>}

          <Heading as="h1" sx={{ mb: 3 }}>
            Login
          </Heading>
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
              onKeyDown={capsLock}
              name="password"
              type="password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              size="large"
              aria-label="Sua senha"
            />
            {capsLockWarnigMessage && (
              <FormControl.Validation variant="warning">{capsLockWarnigMessage}</FormControl.Validation>
            )}
            {errorObject?.key === 'password' && (
              <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
            )}
          </FormControl>
          <FormControl>
            <FormControl.Label visuallyHidden>Login</FormControl.Label>
            <Button variant="primary" size="large" type="submit" disabled={isLoading} aria-label="Login">
              Login
            </Button>
          </FormControl>
        </Box>
      </form>
      <Box sx={{ mt: 6, width: '100%', textAlign: 'center', fontSize: 1 }}>
        Novo no TabNews? <Link href="/cadastro">Crie sua conta aqui.</Link>
      </Box>
    </>
  );
}
