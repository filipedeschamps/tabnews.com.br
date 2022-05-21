import { Box, Heading, Link, Text } from '@primer/react';
import { DefaultLayout } from 'pages/interface/index.js';

export default function ConfirmRecoverPassword() {
  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirme seu email' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
        <Heading as="h1">Sua senha foi alterada com successo!</Heading>
        <Text>
          Agora você pode fazer <Link href="/login">Login</Link>
        </Text>
      </Box>
    </DefaultLayout>
  );
}
