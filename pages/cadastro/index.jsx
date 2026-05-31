import { email, password, useForm, username } from '@tabnews/forms';
import { FormField, Text } from '@tabnews/ui';
import { useRouter } from 'next/router';

import { ButtonWithLoader, DefaultLayout, Flash, Heading, Link } from '@/TabNewsUI';
import { createErrorMessage } from 'interface';

import classes from './index.module.css';

const formConfig = {
  username,
  email,
  password,
  termsAccepted: { checked: false },
  globalMessage: '',
  loading: false,
};

export default function Register() {
  return (
    <DefaultLayout
      containerWidth="small"
      metadata={{
        title: 'Cadastro',
        description:
          'Crie sua conta no TabNews - Plataforma de conteúdos com valor concreto para quem trabalha com tecnologia.',
      }}>
      <Heading as="h1" className={classes.Heading}>
        Cadastro
      </Heading>

      <SignUpForm />
    </DefaultLayout>
  );
}

function SignUpForm() {
  const router = useRouter();
  const { getFieldProps, handleSubmit, state, updateState } = useForm(formConfig);
  const globalErrorMessage = state.globalMessage.error;

  async function onSubmit(data) {
    updateState({
      globalMessage: { error: null },
      loading: { value: true },
    });

    const { username, email, password } = data;

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

      const responseBody = await response.json();

      if (response.status === 201) {
        localStorage.setItem('registrationEmail', email);
        router.push('/cadastro/confirmar');
        return;
      }

      if (response.status === 400) {
        const key = ['username', 'email', 'password'].includes(responseBody.key) ? responseBody.key : 'globalMessage';

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
      <FormField {...getFieldProps('username')} name="name" autoComplete="off" />
      <FormField {...getFieldProps('email')} autoComplete="username" />
      <FormField {...getFieldProps('password')} autoComplete="new-password" />
      <FormField
        {...getFieldProps('termsAccepted')}
        className={classes.TermsField}
        label={
          <Text fontSize="1">
            Li e estou de acordo com os
            <Link href="/termos-de-uso"> Termos de Uso.</Link>
          </Text>
        }
      />

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
        disabled={!state.termsAccepted.checked}
        isLoading={state.loading.value}>
        Criar cadastro
      </ButtonWithLoader>
    </form>
  );
}
