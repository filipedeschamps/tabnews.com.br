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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
        <Heading as="h1" sx={{ textAlign: 'center', mb: 2 }}>
          Confira seu e-mail:
        </Heading>
        <Text
          sx={{
            width: '100%',
            textAlign: 'center',
            overflowWrap: 'break-word',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            mb: 4,
          }}>
          {email}
        </Text>
        <Text>
          Caso o e-mail esteja disponível, você receberá um link para confirmar seu cadastro e ativar a sua conta.
        </Text>
      </Box>
    </DefaultLayout>
  );
}
