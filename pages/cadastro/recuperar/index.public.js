import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { DefaultLayout } from 'pages/interface/index.js';
import { EMAIL_VALIDATOR } from 'infra/utils/regexp';
import { FormControl, Box, Heading, Button, TextInput, Flash } from '@primer/react';

export default function RecoverPassword() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Recuperar senha' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Recuperar senha
      </Heading>

      <RecoverPasswordForm />
    </DefaultLayout>
  );
}

function RecoverPasswordForm() {
  const router = useRouter();

  const dataRef = useRef('');

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
    const data = dataRef.current.value;

    if (!data) {
      setErrorObject({
        key: 'empty',
        message: 'Campo obrigatório',
      });
      return;
    }

    if (data.includes('@')) {
      email = data;
      if (!EMAIL_VALIDATOR.test(data)) {
        setErrorObject({
          key: 'email',
          message: 'Utilize um e-mail válido. Dica: tabnews@tabnews.com.br',
        });
        return;
      }
    } else {
      username = data;
    }
    setIsLoading(true);
    setErrorObject(undefined);

    try {
      const response = await fetch(`/api/v1/recover`, {
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
        return;
      }

      if (response.status >= 403) {
        setGlobalErrorMessage(`${responseBody.message} Informe ao suporte este valor: ${responseBody.error_id}`);
        return;
      }
    } catch (error) {
      setGlobalErrorMessage('Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.');
    } finally {
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
            ref={dataRef}
            onChange={clearErrors}
            name="data"
            size="large"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Seu usuário ou e-mail"
          />
          {['empty', 'email'].includes(errorObject?.key) && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}

          {errorObject?.type === 'string.alphanum' && (
            <FormControl.Caption>Dica: use somente letras e números, por exemplo: nomeSobrenome4 </FormControl.Caption>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label visuallyHidden>Recuperar</FormControl.Label>
          <Button variant="primary" size="large" type="submit" disabled={isLoading} aria-label="Recuperar">
            Recuperar
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}
