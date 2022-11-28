import { Box, Heading, Text } from '@primer/react';
import { DefaultLayout, useResize } from 'pages/interface/index.js';
import Confetti from 'react-confetti';

export default function ConfirmSignup() {
  const documentSize = useResize();

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
          width={documentSize.width}
          height={documentSize.height}
          recycle={false}
          numberOfPieces={800}
          tweenDuration={15000}
          gravity={0.15}
        />
      </div>

      <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirme seu email' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
          <Heading as="h1" sx={{ textAlign: 'center' }}>
            Seu login foi realizado com sucesso!
          </Heading>
          <Text sx={{ textAlign: 'center' }}>
            E pedimos que aguarde por novas features para poder usar o seu usuário dentro do TabNews :)
          </Text>
        </Box>
      </DefaultLayout>
    </>
  );
}
