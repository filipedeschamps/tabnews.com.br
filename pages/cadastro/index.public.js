import { useRouter } from 'next/router';
import { useRef, useState } from 'react';

import {
  Box,
  Button,
  ButtonWithLoader,
  Checkbox,
  DefaultLayout,
  Flash,
  FormControl,
  Heading,
  Link,
  PasswordInput,
  Text,
  TextInput,
} from '@/TabNewsUI';
import { suggestEmail } from 'pages/interface';

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

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

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
          {errorObject?.key === 'email' && errorObject?.message && (
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
        </FormControl>

        <PasswordInput
          inputRef={passwordRef}
          id="password"
          name="password"
          label="Senha"
          errorObject={errorObject}
          setErrorObject={setErrorObject}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Checkbox checked={isTermsAccepted} onClick={() => setIsTermsAccepted(!isTermsAccepted)} />
          <Text>
            Li e estou de acordo com os
            <Link href="/termos-de-uso"> Termos de Uso.</Link>
          </Text>
        </Box>

        <FormControl>
          <FormControl.Label visuallyHidden>Criar cadastro</FormControl.Label>
          <ButtonWithLoader
            variant="primary"
            size="large"
            type="submit"
            sx={{ width: '100%' }}
            aria-label="Criar cadastro"
            disabled={!isTermsAccepted}
            isLoading={isLoading}>
            Criar cadastro
          </ButtonWithLoader>
        </FormControl>
      </Box>
    </form>
  );
}
