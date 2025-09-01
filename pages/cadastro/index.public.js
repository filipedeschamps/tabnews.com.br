import { email, password, useForm, username } from '@tabnews/forms';
import { FormField, Text } from '@tabnews/ui';
import { useRouter } from 'next/router';

import { ButtonWithLoader, DefaultLayout, Flash, Heading, Link } from '@/TabNewsUI';
import { createErrorMessage } from 'pages/interface';

const formConfig = {
  username,
  email,
  password,
  confirmPassword: {
    ...password,
    label: 'Confirme sua senha',
    name: 'confirmPassword',
  },
  termsAccepted: { checked: false },
  globalMessage: '',
  loading: false,
};

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
  const { getFieldProps, handleSubmit, state, updateState } = useForm(formConfig);
  const globalErrorMessage = state.globalMessage.error;

  const passwordsFilled = Boolean(state?.password?.value) && Boolean(state?.confirmPassword?.value);
  const passwordsMismatch = passwordsFilled && state.password.value !== state.confirmPassword.value;

  async function onSubmit(data) {
    if (data.password !== data.confirmPassword) {
      updateState({
        confirmPassword: { error: 'As senhas não coincidem.' },
      });
      return;
    }

    updateState({
      globalMessage: { error: null },
      confirmPassword: { error: null },
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
      <FormField {...getFieldProps('confirmPassword')} autoComplete="new-password" />
      <FormField
        {...getFieldProps('termsAccepted')}
        sx={{ minHeight: 'auto' }}
        label={
          <Text fontSize="1">
            Li e estou de acordo com os
            <Link href="/termos-de-uso"> Termos de Uso.</Link>
          </Text>
        }
      />

      {passwordsMismatch && (
        <Flash variant="danger" sx={{ mt: 2 }}>
          As senhas não coincidem.
        </Flash>
      )}

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
        aria-label="Criar cadastro"
        disabled={!state.termsAccepted.checked}
        isLoading={state.loading.value}>
        Criar cadastro
      </ButtonWithLoader>
    </form>
  );
}
