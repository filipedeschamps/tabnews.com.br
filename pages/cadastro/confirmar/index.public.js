import { useEffect, useState } from 'react';

import { Box, DefaultLayout, Heading, Text } from '@/TabNewsUI';

export default function ConfirmSignup() {
  const [email, setEmail] = useState('');
  const [fontSize, setFontSize] = useState('initial');

  useEffect(() => {
    const userEmail = localStorage.getItem('registrationEmail');
    localStorage.removeItem('registrationEmail');
    setEmail(userEmail);

    const calculatedFontSize = userEmail?.length > 26 ? '16px' : '24px';
    setFontSize(calculatedFontSize);
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
          mt: 10,
        }}>
        <Heading
          as="h1"
          sx={{
            '@media screen and (max-width: 425px)': {
              fontSize,
            },
          }}>
          Confira seu e-mail: {email}
        </Heading>
        <Text>Você receberá um link para confirmar seu cadastro e ativar a sua conta.</Text>
      </Box>
    </DefaultLayout>
  );
}
