import { Box, Heading } from '@primer/react';
import { Viewer } from 'pages/interface';

import { DefaultLayout } from 'pages/interface/index.js';

export default function Page() {
  const body = `Esta página existe para responder as dúvidas mais frequentes sobre o projeto.

  <div id="como-funcionam-as-tabcoins"></div>

  ## Como funcionam as TabCoins?
  As TabCoins são como moedas digitais do TabNews que podem ser usadas para avaliar outras postagens e comentários.

  Você pode ganhar TabCoins das seguintes formas:
  - Ao criar um conteúdo (seja ele um conteúdo que vá para a home ou uma resposta a outro conteúdo) você ganha 2 TabCoins.
  - Ao ter um conteúdo avaliado positivamente você ganha 1 TabCoin (por avaliação).

  Você também pode perder TabCoins nos seguintes casos:
  - Quando você avalia um conteúdo você gasta 2 TabCoins.
  - Quando uma pessoa avalia negativamente o seu conteúdo você perde 1 TabCoin.
  - Quando uma publicação sua é apagada (seja por você ou seja pela moderação) você perde 2 TabCoins + todas as avaliações positivas.

  <div id="como-funcionam-os-tabcashs"></div>

  ## Como funcionam os TabCashs?
  Da mesma forma que as TabCoins, TabCashs são como moedas digitais do TabNews que poderão ser usadas no sistema de Revenue Share (ainda não implementado).

  Atualmente a única forma de ganhar TabCashs é avaliando um conteúdo com TabCoins, você ganha 1 TabCash por avaliação.

  <div id="onde-fazer-testes"></div>

  ## Onde fazer testes?
  Testes das mais variadas formas devem ser feitas no ambiente de homologação. Você pode acessar [esse link](https://github.com/filipedeschamps/tabnews.com.br/deployments/activity_log?environment=Preview) para ver a lista de deploys e depois basta clicar em \`View deployment\` no deploy mais recente para acessar o ambiente.

  Como é um abiente diferente, você precisará criar uma nova conta lá.

  <div id="como-posso-fazer-sugestoes-e-ou-reportar-bugs"></div>

  ## Onde posso fazer sugestões e/ou reportar bugs?
  Para sugestões, pedimos que abra uma issue no [repositório do projeto](https://github.com/filipedeschamps/tabnews.com.br), pois desta forma outras pessoas poderão se beneficiar, incluindo participar adicionando novos pontos de vista ou novas dúvidas.

  Você também poderá criar uma [nova publicação](https://www.tabnews.com.br/publicar) no próprio TabNews para que todos possam participar.


  Caso você descubra ou esbarre com alguma falha, brecha ou vulnerabilidade de segurança do serviço e encontre **informações sensíveis** (por exemplo, dados privados de outros usuários, dados sensíveis do sistema ou acesso não autorizado), pedimos que entre em contato de forma privada através do email \`contato@tabnews.com.br\`.

  Após o fechamento da falha, o TabNews se compromete em criar um Postmortem público com os detalhes do que aconteceu. Não temos interesse algum em esconder estes acontecimentos e queremos compartilhar todos os conhecimentos adquiridos e estratégias adotadas, mantendo em mente que iremos proteger ao máximo dados sensíveis dos usuários.

  Falhas que não possuem informações sensíveis e não irão prejudicar outros usuários poderão ser livremente reportados através de issues no [repositório do projeto](https://github.com/filipedeschamps/tabnews.com.br).

  <div id="como-posso-contribuir-com-o-tabnews"></div>

  ## Como posso contribuir com o TabNews?
  Além de usar o site e publicar conteúdos de forma saudável, o TabNews é um projeto open source. Isso significa que qualquer pessoa pode contribuir com o código do projeto. Para isso, pedimos que leia o [README do projeto no GitHub](https://github.com/filipedeschamps/tabnews.com.br#readme) e caso ainda tenha dúvidas, você pode ler [essa publicação)[https://www.tabnews.com.br/rodrigoKulb/boas-praticas-para-criar-um-pull-request-no-projeto-tabnews-com-br].

  <div id="que-tipo-de-conteudo-eu-posso-publicar-no-tabnews"></div>

  ## Que tipo de conteúdo eu posso publicar no TabNews?
  Consideramos conteúdos de valor concreto: notícias, artigos, tutoriais, indicações, curiosidades, perguntas bem formuladas ou qualquer outro tipo de conteúdo que poderá fazer alguma diferença na vida de quem trabalha em áreas diretamente ou indiretamente relacionadas ao desenvolvimento de software.

  Conteúdos que não se encaixam nessa definição poderão ser removidos pela moderação do TabNews. Então antes de criar uma publicação, leia os [Termos de Uso](/termos-de-uso) e pense se o conteúdo que você quer publicar se encaixa nessa definição.

  <div id="como-funciona-a-aba-relevantes"></div>

  ## Como funciona a aba "Relevantes"?
  O algoritmo que gera a lista de conteúdos relevantes se baseia na quantidade de TabCoins que o conteúdo recebeu e a quanto tempo ele foi publicado.

  <div id="test"></div>

  ## Posso publicar meus projetos aqui?
  Sim, uma explicação com detalhes técnicos e suas experiências na criação do projeto será muito bem-vinda. Para isso você deve usar a tag \`Pitch\` no título do post.

  Lembre-se que se o post for apenas uma propaganda do seu projeto ou não tenha relação com tecnologia, ele poderá ser removido pela moderação do TabNews.

  Caso você queira saber o significado da palavra \`Pitch\`, nada mais é do que uma apresentação curta e objetiva de um projeto, produto ou ideia com a intenção de despertar o interesse de outras pessoas.
  `;

  return (
    <DefaultLayout metadata={{ title: 'FAQ - Perguntas frequentes' }}>
      <Box>
        <Heading as="h1">FAQ - Perguntas Frequentes</Heading>
        <Viewer value={body} />
      </Box>
    </DefaultLayout>
  );
}
