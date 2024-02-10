import { Link, Text } from '@react-email/components';

import { DefaultLayout, DefaultLayoutText } from '../components/default-layout';

export const ConfirmationEmailText = ({ username, confirmationLink }) => {
  const content = `Uma alteração de email foi solicitada.

Clique no link abaixo para confirmar esta alteração:

${confirmationLink}
  
Caso você não tenha feito esta requisição, ignore esse email.`;

  return DefaultLayoutText({ username, content });
};

export const ConfirmationEmailHtml = ({ username, confirmationLink }) => (
  <DefaultLayout username={username} previewText="Alteração de email no Tabnews">
    <Text style={text}>Uma alteração de email foi solicitada.</Text>

    <Link href={confirmationLink} style={link}>
      Clique aqui para confirmar esta alteração.
    </Link>

    <Text style={text}>Se você não conseguir clicar no link, copie e cole o endereço abaixo no seu navegador:</Text>

    <code style={code}>{confirmationLink}</code>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

ConfirmationEmailHtml.PreviewProps = {
  username: 'User',
  confirmationLink: 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID',
};

export default ConfirmationEmailHtml;

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
