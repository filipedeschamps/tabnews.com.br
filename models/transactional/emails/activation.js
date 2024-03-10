import { DefaultLayout, DefaultLayoutText, Link, LinkText, Text } from '../components';

export const ActivationEmailText = ({ username, activationLink }) => {
  const content = `Clique no link abaixo para ativar seu cadastro no TabNews:

${activationLink}

Caso você não tenha feito esta requisição, ignore esse email.`;

  return DefaultLayoutText({ username, content });
};

export const ActivationEmailHtml = ({ username, activationLink }) => (
  <DefaultLayout username={username} previewText="Ative seu cadastro no TabNews">
    <Link href={activationLink}>Clique aqui para ativar seu cadastro no TabNews.</Link>

    <LinkText>{activationLink}</LinkText>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

ActivationEmailHtml.PreviewProps = {
  username: 'User',
  activationLink: 'https://tabnews.com.br/cadastro/ativar/TOKEN_ID',
};

export default ActivationEmailHtml;

const text = {
  margin: '24px 0',
};
