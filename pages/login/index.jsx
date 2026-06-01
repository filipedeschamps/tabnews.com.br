import { email, password, useForm } from '@tabnews/forms';
import { tryParseUrl } from '@tabnews/helpers';
import { FormField } from '@tabnews/ui';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { ButtonWithLoader, DefaultLayout, Flash, Heading, Link } from '@/TabNewsUI';
import { createErrorMessage, useUser } from 'interface';

import classes from './index.module.css';

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
    <DefaultLayout
      containerWidth="small"
      metadata={{
        title: 'Login',
        description:
          'Entrar no TabNews - Plataforma de conteúdos com valor concreto para quem trabalha com tecnologia.',
        canonical: '/login',
      }}>
      <Heading as="h1" className={classes.Heading}>
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
        <Flash variant="danger" className={classes.Flash}>
          {globalErrorMessage}
        </Flash>
      )}

      <ButtonWithLoader
        variant="primary"
        size="large"
        type="submit"
        className={classes.Submit}
        isLoading={state.loading.value}>
        Login
      </ButtonWithLoader>

      <div className={classes.Links}>
        <span>
          Novo no TabNews? <Link href="/cadastro">Crie sua conta aqui.</Link>
        </span>
        <span>
          Esqueceu sua senha? <Link href="/cadastro/recuperar">Clique aqui.</Link>
        </span>
      </div>
    </form>
  );
}
