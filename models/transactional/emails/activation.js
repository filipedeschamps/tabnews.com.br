import { Link, Text } from '@react-email/components';

import { DefaultLayout, DefaultLayoutText } from '../components/default-layout';

export const ActivationEmailText = ({ username, activationLink }) => {
  const content = `Clique no link abaixo para ativar seu cadastro no TabNews:

${activationLink}

Caso você não tenha feito esta requisição, ignore esse email.`;

  return DefaultLayoutText({ username, content });
};

export const ActivationEmailHtml = ({ username, activationLink }) => (
  <DefaultLayout username={username} previewText="Ative seu cadastro no TabNews">
    <Link href={activationLink} style={link}>
      Clique aqui para ativar seu cadastro no TabNews.
    </Link>

    <Text style={text}>Se você não conseguir clicar no link, copie e cole o endereço abaixo no seu navegador:</Text>

    <code style={code}>{activationLink}</code>

    <Text style={text}>Caso você não tenha feito esta requisição, ignore esse email.</Text>
  </DefaultLayout>
);

ActivationEmailHtml.PreviewProps = {
  username: 'User',
  activationLink: 'https://tabnews.com.br/cadastro/ativar/TOKEN_ID',
};

export default ActivationEmailHtml;

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
