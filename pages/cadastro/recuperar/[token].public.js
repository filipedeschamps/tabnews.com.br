import { useState, useRef } from 'react';
import fetch from 'cross-fetch';
import { FormControl, Box, Heading, Button, TextInput, Flash } from '@primer/react';
import { DefaultLayout } from 'pages/interface/index.js';
import { useRouter } from 'next/router';

export default function RecoverPassword() {
  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Recuperação de Senha' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Defina uma nova senha
      </Heading>

      <RecoverPasswordForm />
    </DefaultLayout>
  );
}

function RecoverPasswordForm() {
  const router = useRouter();
  const { token } = router.query;

  const passwordRef = useRef('');
  const passwordConfirmRef = useRef('');

  const [globalErrorMessage, setGlobalErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObject, setErrorObject] = useState(undefined);
  const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(false);

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

    const password = passwordRef.current.value;
    const passwordConfirm = passwordConfirmRef.current.value;

    if (!password) {
      setErrorObject({
        key: 'empty',
        message: 'Campo obrigatório',
      });
      return;
    }

    if (password !== passwordConfirm) {
      setErrorObject({
        key: 'password_confirm',
        message: 'As senhas devem ser iguais.',
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: token,
          password,
        }),
      });

      setGlobalErrorMessage(undefined);
      const responseBody = await response.json();

      if (response.status === 200) {
        router.push('/cadastro/recuperar/sucesso');
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

        <FormControl id="password">
          <FormControl.Label>Senha</FormControl.Label>
          <TextInput
            ref={passwordRef}
            onChange={clearErrors}
            onKeyDown={detectCapsLock}
            onKeyUp={detectCapsLock}
            name="password"
            type="password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            size="large"
            block={true}
            aria-label="Sua senha"
          />
          {capsLockWarningMessage && (
            <FormControl.Validation variant="warning">{capsLockWarningMessage}</FormControl.Validation>
          )}
          {errorObject?.key === 'empty' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
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
            block={true}
            aria-label="Repita a senha"
          />
          {errorObject?.key === 'password_confirm' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label visuallyHidden>Alterar senha</FormControl.Label>
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
            sx={{ width: '100%' }}
            aria-label="Alterar senha">
            Alterar senha
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}
