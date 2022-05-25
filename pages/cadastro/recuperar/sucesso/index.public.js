import { Box, Heading, Link, Text } from '@primer/react';
import { DefaultLayout } from 'pages/interface/index.js';

export default function ConfirmRecoverPassword() {
  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Nova senha definida com sucesso!' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
        <Heading as="h1">Nova senha definida com sucesso!</Heading>
        <Text>
          Agora você pode fazer o <Link href="/login">Login</Link> utilizando esta nova senha.
        </Text>
      </Box>
    </DefaultLayout>
  );
}
