import { useState } from 'react';

import { DefaultLayout, Heading } from '@/TabNewsUI';

import classes from './index.module.css';

export default function ConfirmSignup() {
  const [email] = useState(() => {
    if (typeof localStorage === 'undefined') return null;
    const userEmail = localStorage.getItem('registrationEmail');
    localStorage.removeItem('registrationEmail');
    return userEmail;
  });

  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirme seu email' }}>
      <div className={classes.Wrapper}>
        <Heading as="h1" className={classes.Heading}>
          Confira seu e-mail:
        </Heading>
        <span className={classes.Email}>{email}</span>
        <span>
          Caso o e-mail esteja disponível, você receberá um link para confirmar seu cadastro e ativar a sua conta.
        </span>
      </div>
    </DefaultLayout>
  );
}
