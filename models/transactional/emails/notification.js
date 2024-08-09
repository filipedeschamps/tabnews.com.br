import { DefaultLayout, DefaultLayoutText, Link, LinkText, Text } from '../components';

export const NotificationEmailText = ({ username, bodyReplyLine, contentLink }) => {
  const content = `${bodyReplyLine} Para ler a resposta, utilize o link abaixo:

${contentLink}`;

  return DefaultLayoutText({ username, content });
};

export const NotificationEmailHtml = ({ username, bodyReplyLine, contentLink }) => (
  <DefaultLayout username={username} previewText="Nova resposta no TabNews">
    <Text style={text}>{bodyReplyLine}</Text>

    <Link href={contentLink}>Clique aqui para ler a resposta.</Link>

    <LinkText>{contentLink}</LinkText>
  </DefaultLayout>
);

NotificationEmailHtml.PreviewProps = {
  username: 'User',
  bodyReplyLine: '"User2" respondeu à sua publicação "Título publicação".',
  contentLink: 'https://tabnews.com.br/user2/titulo-publicacao',
};

export default NotificationEmailHtml;

const text = {
  margin: '24px 0',
};
