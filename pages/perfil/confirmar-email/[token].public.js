import fetch from 'cross-fetch';
import { Box, Flash } from '@primer/react';
import { DefaultLayout, Confetti } from 'pages/interface/index.js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ActiveUser() {
  const router = useRouter();
  const { token } = router.query;

  const [globalMessage, setGlobalMessage] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailConfirmation = async (token) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: token,
        }),
      });

      if (response.status === 200) {
        setIsSuccess(true);
        setGlobalMessage('Seu email foi alterado com sucesso!');

        return;
      }

      if (response.status >= 400 && response.status <= 503) {
        const responseBody = await response.json();
        setGlobalMessage(`${responseBody.message} ${responseBody.action}`);
        setIsSuccess(false);
        return;
      }

      setIsSuccess(false);
      throw new Error(response.statusText);
    } catch (error) {
      setGlobalMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleEmailConfirmation(token);
    }
  }, [token]);

  return (
    <>
      {isSuccess && <Confetti />}
      <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirmar alteração de email' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
          {isLoading ? (
            <Flash variant="default">Verificando Token de Alteração de Email...</Flash>
          ) : (
            <Flash variant={isSuccess ? 'success' : 'danger'}>{globalMessage}</Flash>
          )}
        </Box>
      </DefaultLayout>
    </>
  );
}
