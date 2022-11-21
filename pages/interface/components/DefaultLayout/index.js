import { Box, Flash } from '@primer/react';
import { Footer, Head, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  return (
    <>
      {metadata && <Head metadata={metadata} />}
      <Header />
      <Box
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          padding: [2, null, null, 4],
          paddingTop: [3, null, null, 4],
        }}>
        <Box sx={{ mb: 4 }}>
          <Flash variant="warning">
            Turma, dado ao alto volume de acessos precisamos temporariamente desativar a nossa API, mas estamos
            trabalhando para voltar o mais rápido possível :) então por enquanto o TabNews está somente no modo leitura,
            combinado? 🤝
          </Flash>
        </Box>

        {children}
      </Box>
      <Footer
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          paddingX: [2, null, null, 4],
          paddingTop: 3,
        }}
      />
    </>
  );
}
