import Image from 'next/image';
import { DefaultLayout } from 'pages/interface/index.js';
import { Box, Link } from '@primer/react';
import botSleepyFaceDarkTransparent from 'public/brand/bot-sleepy-face-dark-transparent.svg';

export default function Custom404() {
  return (
    <>
      <DefaultLayout metadata={{ title: '404 - Página não encontrada' }}>
        <Box
          sx={{
            height: 'calc(90vh - 64px)',
            width: '100%',
            display: 'flex',
            alignContent: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
            <Image
              src={botSleepyFaceDarkTransparent.src}
              height={100}
              width={100}
              sx={{ opacity: '0.7' }}
              alt="Ícone do Bot triste"
            />
            <Box
              sx={{
                height: '80px',
                margin: '10px',
                borderWidth: 0,
                borderLeftWidth: 1,
                borderColor: 'border.muted',
                borderStyle: 'solid',
                paddingRight: '10px',
              }}></Box>
            <h1>404</h1>
          </Box>
          <h2>Página não encontrada</h2>
          <Link href="/">Retornar à tela inicial</Link>
        </Box>
      </DefaultLayout>
    </>
  );
}
