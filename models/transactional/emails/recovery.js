import { Link, Text } from '@react-email/components';

import { DefaultLayout, DefaultLayoutText } from '../components/default-layout';

export const RecoveryEmailText = ({ username, recoveryLink }) => {
  const content = `Uma recuperação de senha foi solicitada. Caso você não tenha feito a solicitação, ignore esse email.

Caso você tenha feito essa solicitação, clique no link abaixo para definir uma nova senha:

${recoveryLink}`;

  return DefaultLayoutText({ username, content });
};

export const RecoveryEmailHtml = ({ username, recoveryLink }) => (
  <DefaultLayout username={username} previewText="Recuperação de senha no Tabnews">
    <Text style={text}>Uma recuperação de senha foi solicitada.</Text>

    <Link href={recoveryLink} style={link}>
      Clique aqui para definir uma nova senha.
    </Link>

    <Text style={text}>Se você não conseguir clicar no link, copie e cole o endereço abaixo no seu navegador:</Text>

    <code style={code}>{recoveryLink}</code>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

RecoveryEmailHtml.PreviewProps = {
  username: 'User',
  recoveryLink: 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID',
};

export default RecoveryEmailHtml;

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
  display: 'block',
  marginBottom: '16px',
};

const text = {
  color: '#333',
  fontSize: '14px',
  margin: '24px 0',
};

const code = {
  backgroundColor: '#f3f3f3',
  color: '#333',
  display: 'block',
  fontSize: '14px',
  padding: '12px',
  borderRadius: '8px',
  wordBreak: 'break-all',
};
