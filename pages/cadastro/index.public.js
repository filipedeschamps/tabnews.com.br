import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout } from 'pages/interface/index.js';
import { FormControl, Box, Heading, Button, TextInput, Flash } from '@primer/react';

export default function Register() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Cadastro' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Cadastro
      </Heading>

      <SignUpForm />
    </DefaultLayout>
  );
}

function SignUpForm() {
  const router = useRouter();

  const usernameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const passwordConfirmRef = useRef('');

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
    const passwordConfirm = passwordConfirmRef.current.value;

    if (password !== passwordConfirm) {
      setErrorObject({
        key: 'password_confirm',
        message: 'As senhas devem ser iguais.',
      });
      setIsLoading(false);
      return;
    }

    if (errorObject) {
      setIsLoading(false);
      setErrorObject(undefined);
      return;
    }

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

      if (response.status === 201) {
        localStorage.setItem('registrationEmail', email);
        router.push('/cadastro/confirmar');
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

        <FormControl id="passwordConfirm">
          <FormControl.Label>Repita a senha</FormControl.Label>
          <TextInput
            ref={passwordConfirmRef}
            onChange={clearErrors}
            name="passwordConfirm"
            type="password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            size="large"
            aria-label="Repita a senha"
          />
          {errorObject?.key === 'password_confirm' && (
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
