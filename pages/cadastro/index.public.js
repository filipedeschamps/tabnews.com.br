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
          />
          {errorObject?.key === 'email' && (
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
          {errorObject?.key === 'password' && (
            <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
          )}
        </FormControl>

        <FormControl>
          <FormControl.Label visuallyHidden>Criar cadastro</FormControl.Label>
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
            sx={{ width: '100%' }}
            aria-label="Criar cadastro">
            Criar cadastro
          </Button>
        </FormControl>
      </Box>
    </form>
  );
}

// TODO: move to a separate file to make it reusable
// or to a separate module to share it with the open source community.
function suggestEmail(typedEmail) {
  const userName = typedEmail.split('@')[0];
  const typedDomain = typedEmail.split('@')[1];
  const domains = [
    ['gmail', 'gmail.com'],
    ['gmail.', 'gmail.com'],
    ['gmail.c', 'gmail.com'],
    ['gmail.co', 'gmail.com'],
    ['gmail.coom', 'gmail.com'],
    ['gmail.comm', 'gmail.com'],
    ['gmail.com.', 'gmail.com'],
    ['gmail.com.b', 'gmail.com'],
    ['gmail.com.br', 'gmail.com'],
    ['mail.com', 'gmail.com'],
    ['dmail.com', 'gmail.com'],
    ['gmad.com,', 'gmail.com'],
    ['gimail.com', 'gmail.com'],
    ['mgil.com', 'gmail.com'],
    ['gil.com', 'gmail.com'],
    ['gmaul.com', 'gmail.com'],
    ['gnail.com', 'gmail.com'],
    ['gail.com', 'gmail.com'],
    ['gamail.com', 'gmail.com'],
    ['gamial.com', 'gmail.com'],
    ['gamil.com', 'gmail.com'],
    ['gmail.cpm', 'gmail.com'],
    ['ggmail.com', 'gmail.com'],
    ['gmai.com', 'gmail.com'],
    ['gmaiil.com', 'gmail.com'],
    ['gmail.cm', 'gmail.com'],
    ['gmaild.com', 'gmail.com'],
    ['gmaile.com', 'gmail.com'],
    ['gmaill.com', 'gmail.com'],
    ['gmain.com', 'gmail.com'],
    ['gmaio.com', 'gmail.com'],
    ['gmail.cok', 'gmail.com'],
    ['gmal.com', 'gmail.com'],
    ['gmali.com', 'gmail.com'],
    ['gmil.co', 'gmail.com'],
    ['gmanil.com', 'gmail.com'],
    ['gmaol.com', 'gmail.com'],
    ['gmaqil.com', 'gmail.com'],
    ['gmeil.com', 'gmail.com'],
    ['gmial.com', 'gmail.com'],
    ['gmil.com', 'gmail.com'],
    ['gmmail.com', 'gmail.com'],
    ['gmsil.com', 'gmail.com'],
    ['hmail.com', 'gmail.com'],
    ['ygmail.com', 'gmail.com'],
    ['gmiail.com', 'gmail.com'],
    ['gemail.com', 'gmail.com'],
    ['gmail.con', 'gmail.com'],
    ['gail.com.ar', 'gmail.com'],
    ['gamail.com.ar', 'gmail.com'],
    ['gamial.com.ar', 'gmail.com'],
    ['gamil.com.ar', 'gmail.com'],
    ['ggmail.com.ar', 'gmail.com'],
    ['gmai.com.ar', 'gmail.com'],
    ['gmaiil.com.ar', 'gmail.com'],
    ['gmail.cm.br', 'gmail.com'],
    ['gmail.cm.ar', 'gmail.com'],
    ['gmaild.com.ar', 'gmail.com'],
    ['gmaile.com.ar', 'gmail.com'],
    ['gmaill.com.ar', 'gmail.com'],
    ['gmain.com.ar', 'gmail.com'],
    ['gmaio.com.ar', 'gmail.com'],
    ['gmal.com.ar', 'gmail.com'],
    ['gmali.com.ar', 'gmail.com'],
    ['gmanil.com.ar', 'gmail.com'],
    ['gmaol.com.ar', 'gmail.com'],
    ['gmailee.com', 'gmail.com'],
    ['gmaqil.com.ar', 'gmail.com'],
    ['gmeil.com.ar', 'gmail.com'],
    ['gmial.com.ar', 'gmail.com'],
    ['gmil.com.ar', 'gmail.com'],
    ['gmmail.com.ar', 'gmail.com'],
    ['gmsil.com.ar', 'gmail.com'],
    ['hmail.com.ar', 'gmail.com'],
    ['ygmail.com.ar', 'gmail.com'],
    ['gmail.cim', 'gmail.com'],
    ['gmail.com.ar', 'gmail.com'],
    ['gmailc.om', 'gmail.com'],
    ['gmnail.com', 'gmail.com'],
    ['gmakl.com', 'gmail.com'],
    ['gmol.com', 'gmail.com'],
    ['gmail.cin', 'gmail.com'],
    ['gmail.cim', 'gmail.com'],
    ['gmaiq.com', 'gmail.com'],
    ['gmailc.mo', 'gmail.com'],
    ['hitmail.com', 'hotmail.com'],
    ['htmail.com', 'hotmail.com'],
    ['hotmail.coom', 'hotmail.com'],
    ['hotmail.comm', 'hotmail.com'],
    ['hotnail.ckm', 'hotmail.com'],
    ['hatmail.com', 'hotmail.com'],
    ['hotomail.com', 'hotmail.com'],
    ['otmail.com', 'hotmail.com'],
    ['hoitmail.com', 'hotmail.com'],
    ['hoimail.com', 'hotmail.com'],
    ['hotnail.com', 'hotmail.com'],
    ['homail.com', 'hotmail.com'],
    ['homtail.com', 'hotmail.com'],
    ['homtmail.com', 'hotmail.com'],
    ['hormail.com', 'hotmail.com'],
    ['hotail.com', 'hotmail.com'],
    ['hotamail.com', 'hotmail.com'],
    ['hotamil.com', 'hotmail.com'],
    ['hotmaail.com', 'hotmail.com'],
    ['hotmai.com', 'hotmail.com'],
    ['hotmaiil.com', 'hotmail.com'],
    ['hotmail.con', 'hotmail.com'],
    ['hotmail.co', 'hotmail.com'],
    ['hotmail.cm', 'hotmail.com'],
    ['hotmaill.com', 'hotmail.com'],
    ['hotmail.net', 'hotmail.com'],
    ['hotmail.ocm', 'hotmail.com'],
    ['hotmailt.com', 'hotmail.com'],
    ['hotmal.com', 'hotmail.com'],
    ['hotmial.com', 'hotmail.com'],
    ['hotmiail.com', 'hotmail.com'],
    ['hotmil.co', 'hotmail.com'],
    ['hotmil.com', 'hotmail.com'],
    ['hotmmail.com', 'hotmail.com'],
    ['hotmqil.com', 'hotmail.com'],
    ['hotmsil.com', 'hotmail.com'],
    ['htoamil.com', 'hotmail.com'],
    ['htomail.com', 'hotmail.com'],
    ['hoymail.com', 'hotmail.com'],
    ['hootmail.com', 'hotmail.com'],
    ['hotmi.com', 'hotmail.com'],
    ['hotmail.com.com', 'hotmail.com'],
    ['hotma.com', 'hotmail.com'],
    ['hotmali.com', 'hotmail.com'],
    ['hotrmail.com', 'hotmail.com'],
    ['hotmail.cim', 'hotmail.com'],
    ['hotmail.cin', 'hotmail.com'],
    ['bol.com', 'bol.com.br'],
    ['yahoo.coom', 'yahoo.com'],
    ['yahoo.comm', 'yahoo.com'],
    ['yahoo.con', 'yahoo.com'],
    ['yaho.com', 'yahoo.com'],
    ['protonmil.com', 'protonmail.com'],
    ['outlok.com', 'outlook.com'],
    ['outlook.con', 'outlook.com'],
    ['outloo.com', 'outlook.com'],
    ['outlook.cm', 'outlook.com'],
    ['outlook.comm', 'outlook.com'],
    ['outlook.co', 'outlook.com'],
    ['prontomail.com', 'protonmail.com'],
    ['zipmail.combr', 'zipmail.com.br'],
  ];

  for (const domain of domains) {
    const wrongDomain = domain[0];
    const rightDomain = domain[1];

    if (typedDomain === wrongDomain) {
      return `${userName}@${rightDomain}`;
    }
  }

  return false;
}
