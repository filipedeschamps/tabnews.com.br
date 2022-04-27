import { Box, Heading, Text } from '@primer/react';
import { useState, useEffect } from 'react';
import { DefaultLayout } from 'pages/interface/index.js';

export default function ConfirmSignup() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem('registrationEmail');
    setEmail(userEmail);
  }, []);

  return (
    <DefaultLayout>
      <Box sx={{ padding: [3, null, null, 4] }}>
        <Box display="grid" width="100%" gridGap={3} sx={{ mt: '50px' }}>
          <Heading as="h1" sx={{ textAlign: 'center' }}>
            Confira seu e-mail: {email}
          </Heading>
          <Text sx={{ textAlign: 'center' }}>
            Você receberá um link para confirmar seu cadastro e ativar a sua conta.
          </Text>
        </Box>
      </Box>
    </DefaultLayout>
  );
}
