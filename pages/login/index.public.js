import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import {
  Box,
  Button,
  DefaultLayout,
  Flash,
  FormControl,
  Heading,
  Link,
  PasswordInput,
  Text,
  TextInput,
} from '@/TabNewsUI';
import { useUser } from 'pages/interface';

export default function Login() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Login', canonical: '/login' }}>
      <LoginForm />
    </DefaultLayout>
  );
}

function LoginForm() {
  const { fetchUser, user } = useUser();
  const router = useRouter();
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const ref2fa = useRef('');

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [requires_2fa, setRequires2fa] = useState(false);
  useEffect(() => {
    if (user && router) {
      if (router.query?.redirect) {
        router.push(router.query.redirect);
      } else {
        router.push('/publicar');
      }
    }
  }, [user, router]);

  function detectCapsLock(event) {
    if (event.getModifierState('CapsLock')) {
      setCapsLockWarningMessage('Atenção: Caps Lock está ativado.');
      return;
    }

    setCapsLockWarningMessage(false);
  }

  function clearErrors() {
    setErrorObject(undefined);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const code_2fa = ref2fa.current.value;

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
          email,
          password,
          code_2fa,
        }),
      });

      setGlobalErrorMessage(undefined);

      const responseBody = await response.json();

      if (response.status === 201) {
        fetchUser();
        return;
      }
      if (responseBody.error_location_code === 'MODEL:AUTHENTICATION:VERIFY_2FA:CODE_NOT_PRESENT') {
        setRequires2fa(true);
        setIsLoading(false);
      }

      if (response.status === 400) {
        if (responseBody.key === 'code_2fa') {
          setGlobalErrorMessage('Digite um código 2FA válido!');
        }
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
              block={true}
              aria-label="Seu email"
              contrast
              sx={{ minHeight: '46px', px: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
            />
            {errorObject?.key === 'email' && (
              <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
            )}
          </FormControl>
          <PasswordInput
            inputRef={passwordRef}
            id="password"
            name="password"
            label="Senha"
            errorObject={errorObject}
            setErrorObject={setErrorObject}
          />

          {requires_2fa ? (
            <FormControl id="2fa">
              <FormControl.Label>Codigo 2FA (6 digitos)</FormControl.Label>
              <TextInput
                ref={ref2fa}
                onChange={clearErrors}
                onKeyDown={detectCapsLock}
                onKeyUp={detectCapsLock}
                name="2fa"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                size="large"
                block={true}
                aria-label="Codigo 2FA"
              />
            </FormControl>
          ) : null}

          <FormControl>
            <FormControl.Label visuallyHidden>Login</FormControl.Label>
            <Button
              variant="primary"
              size="large"
              type="submit"
              disabled={isLoading}
              sx={{ width: '100%' }}
              aria-label="Login">
              Login
            </Button>
          </FormControl>
        </Box>
      </form>
      <Box sx={{ mt: 6, width: '100%', textAlign: 'center', fontSize: 1 }} display="flex" flexDirection="column">
        <Text>
          Novo no TabNews? <Link href="/cadastro">Crie sua conta aqui.</Link>
        </Text>
        <Text>
          Esqueceu sua senha? <Link href="/cadastro/recuperar">Clique aqui.</Link>
        </Text>
      </Box>
    </>
  );
}
