import { Body, Container, Head, Heading, Html, Img, Preview, Text } from '@react-email/components';

export const DefaultLayoutText = ({ username, content }) => {
  return `Olá, ${username}!

${content}

Atenciosamente, 
Equipe TabNews 
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`;
};

export const DefaultLayout = ({ username, previewText, children }) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá, {username}!</Heading>

        {children}

        <Text style={footer}>
          Atenciosamente, <br />
          Equipe TabNews <br />
          Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500
        </Text>
        <Img src="https://www.tabnews.com.br/favicon.png" width="32" height="32" alt="TabNews" />
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '24px',
  marginBottom: '4px',
};
