import { DefaultLayout } from './interface/index.js';
import { Box, Link } from '@primer/react';
import botSleepyFaceDarkTransparent from '../public/brand/bot-sleepy-face-dark-transparent.svg';

export default function Custom404() {
  return (
    <>
      <DefaultLayout metadata={{ title: '404' }}>
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
            <img src={botSleepyFaceDarkTransparent.src} height={'100px'} width={'100px'} sx={{ opacity: '0.7' }} />
            <Box sx={{ height: '80px', margin: '10px', borderLeft: '1px solid rgba(0,0,0,.5)', padding: '10px' }}></Box>
            <h1>404</h1>
          </Box>
          <h2>Página não encontrada</h2>
          <Link href="./" sx={{ color: 'rgb(110, 119, 129)' }}>
            Retornar a tela inicial
          </Link>
        </Box>
      </DefaultLayout>
    </>
  );
}
