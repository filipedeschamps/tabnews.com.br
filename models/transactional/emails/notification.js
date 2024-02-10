import { Link, Text } from '@react-email/components';

import { DefaultLayout, DefaultLayoutText } from '../components/default-layout';

export const NotificationEmailText = ({ username, bodyReplyLine, contentLink }) => {
  const content = `${bodyReplyLine} Para ler a resposta, utilize o link abaixo:

${contentLink}`;

  return DefaultLayoutText({ username, content });
};

export const NotificationEmailHtml = ({ username, bodyReplyLine, contentLink }) => (
  <DefaultLayout username={username} previewText="Nova resposta no Tabnews">
    <Text style={text}>{bodyReplyLine}</Text>

    <Link href={contentLink} style={link}>
      Clique aqui para ler a resposta.
    </Link>

    <Text style={text}>Se você não conseguir clicar no link, copie e cole o endereço abaixo no seu navegador:</Text>

    <code style={code}>{contentLink}</code>
  </DefaultLayout>
);

NotificationEmailHtml.PreviewProps = {
  username: 'User',
  bodyReplyLine: '"User2" respondeu à sua publicação "Título publicação".',
  contentLink: 'https://tabnews.com.br/user2/titulo-publicacao',
};

export default NotificationEmailHtml;

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
  marginBottom: '24px',
};
