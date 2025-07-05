// pages/cadastro/recuperar/[token].public.js (Arquivo modificado para validação em tempo real)

import React, { useState, useEffect } from 'react'; // Importar useState e useEffect
import { passwordConfirmable, passwordConfirmation, useForm } from '@tabnews/forms';
import { FormField } from '@tabnews/ui';
import { useRouter } from 'next/router';

import { ButtonWithLoader, DefaultLayout, Flash, Heading } from '@/TabNewsUI';
import { createErrorMessage } from 'pages/interface';

// Configuração inicial do formulário (mantida, mas os campos de senha serão controlados localmente)
const formConfig = {
  passwordConfirmable: { ...passwordConfirmable, value: '' }, // Adicionado value para controle
  passwordConfirmation: { ...passwordConfirmation, value: '' }, // Adicionado value para controle
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
  // useForm será usado para a submissão, mas os valores dos campos de senha
  // serão controlados pelos estados locais para a validação em tempo real.
  const { handleSubmit, state, updateState } = useForm(formConfig);

  // Estados locais para controlar os valores dos campos de senha e o erro de mismatch
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);

  const globalErrorMessage = state.globalMessage.error;

  // Hook useEffect para validação em tempo real das senhas
  // Este efeito será executado sempre que 'password' ou 'confirmPassword' mudarem
  useEffect(() => {
    // A validação deve acontecer se as senhas são diferentes E pelo menos uma delas não está vazia
    // para evitar que o erro apareça logo que a página carrega.
    if (password !== confirmPassword && (password.length > 0 || confirmPassword.length > 0)) {
      setPasswordMismatchError(true);
    } else {
      setPasswordMismatchError(false);
    }
  }, [password, confirmPassword]); // Dependências do useEffect

  async function onSubmit(data) {
    // A validação de mismatch em tempo real já ocorre, mas mantemos uma verificação final
    // antes de enviar para a API, caso o usuário tente burlar a validação visual.
    if (password !== confirmPassword) {
      setPasswordMismatchError(true); // Garante que o erro seja exibido na submissão também
      return; // Impede a submissão se as senhas não conferem
    }

    updateState({
      globalMessage: { error: null },
      loading: { value: true },
    });

    // A senha a ser enviada é a do estado local, não a do data do useForm
    // (já que useForm não está controlando diretamente os value e onChange dos FormFields para esta validação)
    const passwordToSend = password;

    try {
      const response = await fetch(/api/v1/recovery, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: token,
          password: passwordToSend,
        }),
      });

      const responseBody = await response.json();

      if (response.status === 200) {
        router.push('/cadastro/recuperar/sucesso');
        return;
      }

      if (response.status === 400) {
        // Ajuste a chave do erro se for um erro de passwordMismatch do backend
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
        globalMessage: { error: 'Não foi possível conectar ao TabNews. Por favor, verifique a sua conexão.' },
        loading: { value: false },
      });
    }
  }

  return (
    <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
      <FormField
        {...passwordConfirmable} // Mantém as props padrão do FormField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        // Adicionar onBlur para garantir que o useEffect seja acionado se o onChange não for suficiente
        onBlur={() => {
          if (password.length > 0 || confirmPassword.length > 0) { // Re-check on blur
            setPasswordMismatchError(password !== confirmPassword);
          }
        }}
      />
      <FormField
        {...passwordConfirmation} // Mantém as props padrão do FormField
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        // Adicionar onBlur
        onBlur={() => {
          if (password.length > 0 || confirmPassword.length > 0) { // Re-check on blur
            setPasswordMismatchError(password !== confirmPassword);
          }
        }}
      />

      {/* Renderiza a mensagem de erro se passwordMismatchError for true */}
      {passwordMismatchError && (
        <Flash variant="danger" sx={{ mt: 3 }}>
          Senhas não conferem.
        </Flash>
      )}

      {/* Exibe erros globais da API ou outras validações do useForm */}
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