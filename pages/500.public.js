import Image from 'next/image';
import { DefaultLayout } from './interface/index.js';
import { Box, Link } from '@primer/react';
import botDeadFaceDarkTransparent from '/public/brand/bot-dead-face-dark-transparent.svg';

export default function Custom500() {
  return (
    <>
      <DefaultLayout metadata={{ title: '500 - Erro de servidor' }}>
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
              src={botDeadFaceDarkTransparent.src}
              height={'100px'}
              width={'100px'}
              sx={{ opacity: '0.7' }}
              alt="Ícone do Bot desacordado"
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
            <h1>500</h1>
          </Box>
          <h2>Erro intero de servidor</h2>
          <Link href="/">Retornar à tela inicial</Link>
        </Box>
      </DefaultLayout>
    </>
  );
}
