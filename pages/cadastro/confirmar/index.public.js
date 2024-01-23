import { useEffect, useState } from 'react';

import { Box, DefaultLayout, Heading, Text } from '@/TabNewsUI';

export default function ConfirmSignup() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem('registrationEmail');
    localStorage.removeItem('registrationEmail');
    setEmail(userEmail);
  }, []);

  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirme seu email' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          mt: [4, 8, 10],
        }}>
        <Heading sx={{ fontSize: [2, 3, 4], overflowWrap: 'anywhere' }}>Confira seu e-mail: {email} </Heading>
        <Text>Você receberá um link para confirmar seu cadastro e ativar a sua conta.</Text>
      </Box>
    </DefaultLayout>
  );
}
