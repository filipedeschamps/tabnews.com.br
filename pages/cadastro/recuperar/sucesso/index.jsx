import { DefaultLayout, Heading, Link, Text } from '@/TabNewsUI';

import classes from './index.module.css';

export default function ConfirmRecoverPassword() {
  return (
    <DefaultLayout containerWidth="medium" metadata={{ title: 'Nova senha definida com sucesso!' }}>
      <div className={classes.Wrapper}>
        <Heading as="h1">Nova senha definida com sucesso!</Heading>
        <Text>
          Agora você pode fazer o <Link href="/login">Login</Link> utilizando esta nova senha.
        </Text>
      </div>
    </DefaultLayout>
  );
}
