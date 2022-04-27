import Confetti from 'react-confetti';
import fetch from 'cross-fetch';
import { Box, Flash } from '@primer/react';
import { DefaultLayout } from 'pages/interface/index.js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

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
      <DefaultLayout>
        <Box sx={{ padding: [3, null, null, 4] }}>
          <Box
            sx={{
              maxWidth: '400px',
              marginX: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
            }}>
            <Box display="grid" width="100%" gridGap={3} sx={{ mt: '50px' }}>
              {isLoading ? (
                <Flash variant="default">Verificando Token de Ativação...</Flash>
              ) : (
                <Flash variant={isSuccess ? 'success' : 'danger'}>{globalMessage}</Flash>
              )}
            </Box>
          </Box>
        </Box>
      </DefaultLayout>
    </>
  );
}
