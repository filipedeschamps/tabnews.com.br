import { DefaultLayout, DefaultLayoutText, Link, LinkText, Text } from '../components';

export const RecoveryEmailText = ({ username, recoveryLink }) => {
  const content = `Uma recuperação de senha foi solicitada. Caso você não tenha feito a solicitação, ignore esse email.

Caso você tenha feito essa solicitação, clique no link abaixo para definir uma nova senha:

${recoveryLink}`;

  return DefaultLayoutText({ username, content });
};

export const RecoveryEmailHtml = ({ username, recoveryLink }) => (
  <DefaultLayout username={username} previewText="Recuperação de senha no TabNews">
    <Text style={text}>Uma recuperação de senha foi solicitada.</Text>

    <Link href={recoveryLink}>Clique aqui para definir uma nova senha.</Link>

    <LinkText>{recoveryLink}</LinkText>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

RecoveryEmailHtml.PreviewProps = {
  username: 'User',
  recoveryLink: 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID',
};

export default RecoveryEmailHtml;

const text = {
  margin: '24px 0',
};
