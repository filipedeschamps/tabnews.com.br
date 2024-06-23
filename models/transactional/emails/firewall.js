import { DefaultLayout, DefaultLayoutText, Text } from '../components';

export const FirewallEmailText = ({ username, sideEffectLine, eventId }) => {
  const content = `${sideEffectLine} Caso acredite que isso seja um erro, responda este e-mail para que possamos avaliar a situação.

Identificador do evento: ${eventId}`;

  return DefaultLayoutText({ username, content });
};

export const FirewallEmailHtml = ({ username, sideEffectLine, eventId }) => (
  <DefaultLayout username={username} previewText="Atividade suspeita detectada no TabNews">
    <Text style={text}>{sideEffectLine}</Text>

    <Text style={text}>
      Caso acredite que isso seja um erro, responda este e-mail para que possamos avaliar a situação.
    </Text>

    <Text>Identificador do evento:</Text>

    <code style={code}>{eventId}</code>
  </DefaultLayout>
);

FirewallEmailHtml.PreviewProps = {
  username: 'User',
  sideEffectLine:
    'Identificamos a criação de muitas publicações em um curto período, então a sua publicação "Título da publicação" foi removida.',
  eventId: 'c7854f84-f7b4-468c-9805-a96d7ac4853a',
};

export default FirewallEmailHtml;

const text = {
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
