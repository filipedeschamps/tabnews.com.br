import { passwordConfirmable, passwordConfirmation, useForm } from '@tabnews/forms';
import { FormField } from '@tabnews/ui';
import { useRouter } from 'next/router';

import { ButtonWithLoader, DefaultLayout, Flash, Heading } from '@/TabNewsUI';
import { createErrorMessage } from 'pages/interface';

const formConfig = {
  passwordConfirmable,
  passwordConfirmation,
  globalMessage: '',
  loading: false,
};

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
  const { getFieldProps, handleSubmit, state, updateState } = useForm(formConfig);
  const globalErrorMessage = state.globalMessage.error;

  async function onSubmit(data) {
    updateState({
      globalMessage: { error: null },
      loading: { value: true },
    });

    const password = data.passwordConfirmable;

    try {
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

      const responseBody = await response.json();

      if (response.status === 200) {
        router.push('/cadastro/recuperar/sucesso');
        return;
      }

      if (response.status === 400) {
        const key = responseBody.key === 'password' ? 'passwordConfirmable' : 'globalMessage';

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
      <FormField {...getFieldProps('passwordConfirmable')} />
      <FormField {...getFieldProps('passwordConfirmation')} />

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
        aria-label="Alterar senha"
        isLoading={state.loading.value}>
        Alterar senha
      </ButtonWithLoader>
    </form>
  );
}
