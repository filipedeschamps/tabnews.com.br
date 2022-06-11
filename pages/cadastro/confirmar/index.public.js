import { Box, Heading, Text } from '@primer/react';
import { useState, useEffect } from 'react';
import { DefaultLayout } from 'pages/interface/index.js';

export default function ConfirmSignup() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem('registrationEmail');
    localStorage.removeItem('registrationEmail');
    setEmail(userEmail);
  }, []);

  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirme seu email' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
        <Heading as="h1">Confira seu e-mail: {email}</Heading>
        <Text>Você receberá um link para confirmar seu cadastro e ativar a sua conta.</Text>
      </Box>
    </DefaultLayout>
  );
}
