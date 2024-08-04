import { DefaultLayout, DefaultLayoutText, Link, LinkText, Text } from '../components';

export const ConfirmationEmailText = ({ username, confirmationLink }) => {
  const content = `Uma alteração de email foi solicitada.

Clique no link abaixo para confirmar esta alteração:

${confirmationLink}
  
Caso você não tenha feito esta requisição, ignore esse email.`;

  return DefaultLayoutText({ username, content });
};

export const ConfirmationEmailHtml = ({ username, confirmationLink }) => (
  <DefaultLayout username={username} previewText="Alteração de email no TabNews">
    <Text style={text}>Uma alteração de email foi solicitada.</Text>

    <Link href={confirmationLink}>Clique aqui para confirmar esta alteração.</Link>

    <LinkText>{confirmationLink}</LinkText>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

ConfirmationEmailHtml.PreviewProps = {
  username: 'User',
  confirmationLink: 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID',
};

export default ConfirmationEmailHtml;

const text = {
  margin: '24px 0',
};
