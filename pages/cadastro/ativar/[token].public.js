import { Box, Flash } from '@primer/react';
import fetch from 'cross-fetch';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import { DefaultLayout } from 'pages/interface/index.js';

export default function ActiveUser() {
  const router = useRouter();
  const { token } = router.query;

  const [globalMessage, setGlobalMessage] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [confettiWidth, setConfettiWidth] = useState(0);
  const [confettiHeight, setConfettiHeight] = useState(0);

  useEffect(() => {
    function handleResize() {
      setConfettiWidth(window.screen.width);
      setConfettiHeight(window.screen.height);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleActivateUser = async (token) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/activation`, {
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
        setGlobalMessage('Sua conta foi ativada com sucesso!');

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
      handleActivateUser(token);
    }
  }, [token]);

  return (
    <>
      {isSuccess && (
        <Confetti
          width={confettiWidth}
          height={confettiHeight}
          recycle={false}
          numberOfPieces={800}
          tweenDuration={15000}
          gravity={0.15}
        />
      )}
      <DefaultLayout containerWidth="medium">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
          {isLoading ? (
            <Flash variant="default">Verificando Token de Ativação...</Flash>
          ) : (
            <Flash variant={isSuccess ? 'success' : 'danger'}>{globalMessage}</Flash>
          )}
        </Box>
      </DefaultLayout>
    </>
  );
}
