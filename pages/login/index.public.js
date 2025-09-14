import { email, password, useForm } from '@tabnews/forms';
import { tryParseUrl } from '@tabnews/helpers';
import { FormField } from '@tabnews/ui';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Box, ButtonWithLoader, DefaultLayout, Flash, Heading, Link, Text } from '@/TabNewsUI';
import { createErrorMessage, useUser } from 'pages/interface';

const formConfig = {
  email,
  password,
  globalMessage: '',
  loading: false,
};

export default function Login() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || !user?.id) return;

    const url = tryParseUrl(router.query.redirect);

    if (url.origin === location?.origin) {
      router.replace(url.pathname);
    } else {
      router.replace('/');
    }
  }, [user, router]);

  return (
    <DefaultLayout containerWidth="small" metadata={{ title: 'Login', canonical: '/login' }}>
      <Heading as="h1" sx={{ mb: 3 }}>
        Login
      </Heading>
      <LoginForm />
    </DefaultLayout>
  );
}

function LoginForm() {
  const { fetchUser } = useUser();
  const { getFieldProps, handleSubmit, state, updateState } = useForm(formConfig);
  const globalErrorMessage = state.globalMessage.error;

  async function onSubmit(data) {
    updateState({
      globalMessage: { error: null },
      loading: { value: true },
    });

    const { email, password } = data;

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

      const responseBody = await response.json();

      if (response.status === 201) {
        fetchUser();
        return;
      }

      if (response.status === 400) {
        const key = ['email', 'password'].includes(responseBody.key) ? responseBody.key : 'globalMessage';

        updateState({
          [key]: { error: createErrorMessage(responseBody) },
          loading: { value: false },
        });
        return;
      }

      updateState({
        globalMessage: { error: createErrorMessage(responseBody) },
        loading: { value: false },
      });
    } catch (error) {
      updateState({
        globalMessage: { error: 'Não foi possível se conectar ao TabNews. Por favor, verifique sua conexão.' },
        loading: { value: false },
      });
    }
  }

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
      <FormField {...getFieldProps('email')} />
      <FormField {...getFieldProps('password')} />

      {globalErrorMessage && (
        <Flash variant="danger" sx={{ mt: 3 }}>
          {globalErrorMessage}
        </Flash>
      )}

      <ButtonWithLoader
        variant="primary"
        size="large"
        type="submit"
        sx={{ width: '100%', mt: 3 }}
        isLoading={state.loading.value}>
        Login
      </ButtonWithLoader>

      <Box sx={{ mt: 6, width: '100%', textAlign: 'center', fontSize: 1 }} display="flex" flexDirection="column">
        <Text>
          Novo no TabNews? <Link href="/cadastro">Crie sua conta aqui.</Link>
        </Text>
        <Text>
          Esqueceu sua senha? <Link href="/cadastro/recuperar">Clique aqui.</Link>
        </Text>
      </Box>
    </form>
  );
}
