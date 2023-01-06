import { Box, Heading } from '@primer/react';
import { Viewer } from 'pages/interface';

import { DefaultLayout } from 'pages/interface/index.js';

export default function Page() {
  const body = `Leia com atenção qual a melhor forma de entrar em contato:

  ## Anúncios, Publicidade e Patrocínio

  1. O TabNews é um projeto onde os anúncios são dos **próprios usuários** que criam conteúdos de valor concreto e participam ativamente do site qualificando o conteúdo de outros usuários, o que chamamos de **Fluxo completo de contribuição**.
  2. Caso você seja um anunciante, pedimos encarecidamente que não entre em contato conosco. Nosso **único interesse** é ser a plataforma onde outros usuários poderão contribuir e participar do modelo de Revenue Share (ainda não implementado).

  ## Dúvidas, sugestões e reclamações

  1. Nestes casos, pedimos que abra uma issue no [repositório do projeto](https://github.com/filipedeschamps/tabnews.com.br), pois desta forma outras pessoas poderão se beneficiar, incluindo participar adicionando novos pontos de vista ou novas dúvidas.
  2. Você também poderá criar uma [nova publicação](https://www.tabnews.com.br/publicar) no próprio TabNews para que todos possam participar.

  ## Vulnerabilidades de segurança

  1. Caso você descubra ou esbarre com alguma falha, brecha ou vulnerabilidade de segurança do serviço e encontre **informações sensíveis** (por exemplo, dados privados de outros usuários, dados sensíveis do sistema ou acesso não autorizado), pedimos que entre em contato de forma **privada** através do email \`contato@tabnews.com.br\`.
  2. Após o fechamento da falha, o TabNews se compromete em criar um **Postmortem público** com os detalhes do que aconteceu. Não temos interesse algum em esconder estes acontecimentos e queremos compartilhar todos os conhecimentos adquiridos e estratégias adotadas, mantendo em mente que iremos proteger ao máximo dados sensíveis dos usuários.
  3. Falhas que não possuem informações sensíveis e não irão prejudicar outros usuários poderão ser livremente reportados através de issues no [repositório do projeto](https://github.com/filipedeschamps/tabnews.com.br).

  ## Outros assuntos

  1. Caso você tenha algum outro assunto que não se enquadre nas categorias acima, pedimos que entre em contato através do email \`contato@tabnews.com.br\`.
  2. Em paralelo, aproveitamos para pedir que você leia os [Termos de Uso](/termos-de-uso), pois poderá esclarecer várias dúvidas suas.
  `;

  return (
    <DefaultLayout metadata={{ title: 'Contato' }}>
      <Box>
        <Heading as="h1">Contato</Heading>
        <Viewer value={body} />
      </Box>
    </DefaultLayout>
  );
}
