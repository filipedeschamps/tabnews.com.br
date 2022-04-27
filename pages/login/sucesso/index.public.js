import { Box, Heading, Text } from '@primer/react';
import { useState, useEffect } from 'react';
import { DefaultLayout } from 'pages/interface/index.js';
import Confetti from 'react-confetti';

export default function ConfirmSignup() {
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

  return (
    <>
      <style>{`
        body {
          overflow-x: hidden;
          overflow-y: hidden;
        }
      `}</style>
      <div className="pl-3 pr-3">
        <Confetti
          width={confettiWidth}
          height={confettiHeight}
          recycle={false}
          numberOfPieces={800}
          tweenDuration={15000}
          gravity={0.15}
        />
      </div>

      <DefaultLayout>
        <Box sx={{ padding: [3, null, null, 4] }}>
          <Box display="grid" width="100%" gridGap={3} sx={{ mt: '50px' }}>
            <Heading as="h1" sx={{ textAlign: 'center' }}>
              Seu login foi realizado com sucesso!
            </Heading>
            <Text sx={{ textAlign: 'center' }}>
              E pedimos que aguarde por novas features para poder usar o seu usuário dentro do TabNews :)
            </Text>
          </Box>
        </Box>
      </DefaultLayout>
    </>
  );
}
