import { Box, DefaultLayout, Heading, Link, Text, Viewer } from '@/TabNewsUI';
import { LinkIcon } from '@/TabNewsUI/icons';

export default function Page() {
  const faqContent = [
    {
      id: 'tabnews',
      question: 'O que é o TabNews?',
      answer: `O TabNews é um site focado na comunidade da área de tecnologia, destinado a debates e troca de conhecimentos por meio de publicações e comentários criados pelos próprios usuários.`,
    },
    {
      id: 'proposito-tabnews',
      question: 'Qual é o propósito do TabNews?',
      answer: `O TabNews nasceu com o objetivo de ser um local com **conteúdos de valor concreto para quem trabalha com tecnologia**.

Queremos ter conteúdo de qualidade tanto na publicação principal quanto nos comentários, e algo que contribui para isso acontecer é a plataforma dar o mesmo espaço de criação para quem está publicando ambos os tipos de conteúdo. Tudo no TabNews é considerado um **conteúdo**, tanto que um comentário possui a sua própria página (basta clicar na data de publicação do comentário).`,
    },
    {
      id: 'conteudo-tabnews',
      question: 'Que tipo de conteúdo eu posso publicar no TabNews?',
      answer: `Você pode publicar notícias, artigos, tutoriais, indicações, curiosidades, sugestões de software e ferramentas, perguntas bem formuladas ou outros tipos de conteúdo, desde que o assunto da publicação seja [aceito no TabNews](#assunto-tabnews).`,
    },
    {
      id: 'assunto-tabnews',
      question: 'Que tipo de assunto é aceito no TabNews?',
      answer: `O conteúdo publicado no TabNews deve estar diretamente relacionado à tecnologia. Alguns exemplos de assuntos diretamente relacionados à tecnologia são: desenvolvimento de software, análise de dados, design, inteligência artificial, modelagem 3D, edição de vídeo, manipulação de imagens etc. Exemplos de assuntos indiretamente relacionados à tecnologia, mas que podem ser abordados do ponto de vista da tecnologia, são: produtividade, empreendedorismo, criação de conteúdo etc.`,
    },
    {
      id: 'qualidade-tabnews',
      question: 'Como criar um bom conteúdo no TabNews?',
      answer: `A forma como cada pessoa avalia a qualidade de um conteúdo é subjetiva, mas temos algumas recomendações que podem ajudar a criar uma publicação mais relevante: 

- **Atenção à gramática e aos erros de digitação:** antes de publicar, confirme se precisa corrigir algum erro gramatical ou de digitação. O uso correto da língua portuguesa ajudará a transmitir a sua mensagem para os leitores.
- **Formate o conteúdo para facilitar a leitura:** o editor de texto do TabNews aceita a sintaxe Markdown, então você pode usá-la para identificar no seu texto títulos e subtítulos, trechos de código, citações, enfatizar trechos específicos, exibir diagramas etc.
- **Use imagens e fontes de apoio quando for apropriado:** nem todo conteúdo precisa de imagens ou links de referência, mas isso pode ajudar a transmitir mais credibilidade e facilitar o entendimento do seu conteúdo. Você também pode disponibilizar links para o leitor se aprofundar no assunto.
- **Transmita informações corretas:** antes de compartilhar um fato ou notícia, confirme se isso é realmente verdade. Se for algo opinativo, deixe claro que está compartilhando a sua opinião ou de um terceiro.`,
    },
    {
      id: 'tabcash',
      question: 'O que é TabCash?',
      answer: `O TabCash é uma moeda digital para recompensar pessoas que estão criando conteúdos com valor concreto e também ajudando a qualificar outros conteúdos. O saldo de TabCash poderá ser utilizado no sistema de Revenue Share, onde você poderá usar espaços de anúncio para compartilhar o que desejar, desde que respeite os [Termos de Uso](/termos-de-uso). Esse sistema ainda não está implementado, mas você pode [acompanhar o progresso no GitHub](https://github.com/filipedeschamps/tabnews.com.br/issues/1490).`,
    },
    {
      id: 'ganhar-tabcash',
      question: 'Como ganhar TabCash?',
      answer: `Para ganhar TabCash, é necessário contribuir com a qualificação de conteúdos de outras pessoas, consumindo 2 TabCoins a cada qualificação realizada e, ao mesmo tempo, ganhando 1 TabCash.`,
    },
    {
      id: 'tabcoin',
      question: 'O que é TabCoin?',
      answer: `TabCoin é a moeda de troca no sistema de qualificação de conteúdos do TabNews. Você utiliza seus TabCoins para qualificar conteúdos dos outros e, por sua vez, recebe ou perde TabCoins com base nas qualificações recebidas em seus próprios conteúdos.`,
    },
    {
      id: 'ganhar-tabcoins',
      question: 'Como ganhar TabCoins?',
      answer: `As formas de ganho de TabCoins são:

- **Criando um conteúdo:** existe um algoritmo que leva em consideração os TabCoins dos seus conteúdos mais recentes para definir quantos TabCoins você ganhará ao criar um novo conteúdo.
- **Recebendo votos positivos:** quando outro usuário avalia positivamente seu conteúdo.
- **Recompensa diária:** você pode ganhar TabCoins ao acessar o TabNews pelo menos uma vez no dia. Existe um algoritmo que leva em consideração as qualificações dos seus conteúdos mais recentes e também a quantidade de TabCoins que você possui. Quanto melhor avaliados forem seus conteúdos e menos TabCoins você possuir, mais receberá na recompensa diária.`,
    },
    {
      id: 'perder-tabcoins',
      question: 'É possível perder TabCoins?',
      answer: `Sim, você pode perder TabCoins:

- **Ao apagar um conteúdo:** você perderá os TabCoins que ganhou ao criar o conteúdo, caso tenha ganhado algum TabCoin, e também perderá os TabCoins que ganhou com as avaliações positivas nessa publicação. O mesmo vale para caso um moderador apague um conteúdo seu.
- **Recebendo votos negativos:** você perderá 1 TabCoin a cada avaliação negativa recebida de outros usuários em seus conteúdos.`,
    },
    {
      id: 'utilizar-tabcoins',
      question: 'Como utilizar meus TabCoins?',
      answer: `Os TabCoins são utilizados para poder qualificar conteúdos de outros usuários e ajudar a comunidade a identificar conteúdos relevantes.

Ao avaliar uma publicação, serão consumidos 2 TabCoins e creditado 1 TabCash nos seus saldos.`,
    },
    {
      id: 'publicar-projeto-envolvido',
      question: 'Posso criar publicações divulgando projetos em que estou envolvido?',
      answer: `Sim, você pode criar uma publicação sobre um projeto que está envolvido desde que agregue valor ao leitor, por exemplo explicando detalhes técnicos do projeto, compartilhando suas experiências na criação, dificuldades e decisões tomadas.

Se você pretende fazer um pitch, ou seja, uma apresentação curta e direta com o objetivo despertar atenção das pessoas para o projeto em si, você deve colocar \`Pitch\` no título da publicação, por exemplo: \`Pitch: TabInvest — Um TabNews sobre investimentos\`. Mesmo sendo um pitch você deve contribuir com a comunidade como explicado no parágrafo anterior.

Uma divulgação de um projeto que você está envolvido deve seguir as mesmas regras de qualquer outra publicação: leia os [Termos de Uso](/termos-de-uso) e o tópico [Que tipo de conteúdo eu posso publicar no TabNews?](#publicar-tabnews). Publicações com foco exclusivo comercial são expressamente proibidas.`,
    },
    {
      id: 'publicar-mesmo-conteudo',
      question: 'Posso publicar o mesmo conteúdo várias vezes?',
      answer: `Não. Se deseja criar uma nova publicação sobre o mesmo assunto, leve em consideração há quanto tempo o conteúdo foi feito e o quão diferente será a nova publicação. Lembre-se que toda publicação está sujeita à qualificação por outros usuários através do uso de TabCoins, e casos de abuso serão tratados pela moderação. Apagar um conteúdo avaliado negativamente e republicá-lo para tentar chamar mais atenção é um exemplo de **manipulação das qualificações** e poderá resultar no banimento permanente da sua conta, como dito nos [Termos de Uso](/termos-de-uso).`,
    },
    {
      id: 'erro-nova-publicacao',
      question: 'Não consigo criar novas publicações. O que fazer?',
      answer: `Se, ao criar uma nova publicação ou comentário, você recebe uma mensagem de erro dizendo que não é possível publicar porque há outras publicações mal avaliadas que ainda não foram excluídas, revise seus conteúdos mais recentes que estão zerados ou negativados. Essa é uma proteção para o TabNews e para o usuário, impedindo a criação de muitas publicações mal recebidas e permitindo que o usuário analise o que está fazendo de errado e corrija seu comportamento.

Ao encontrar suas publicações que estão qualificadas negativamente, você poderá apagar alguma e tentar criar a publicação que deseja. O TabNews avaliará suas publicações novamente para definir se você pode ou não criar uma nova publicação. Caso receba a mesma mensagem de erro, basta realizar o processo novamente.`,
    },
    {
      id: 'como-relevantes',
      question: 'Como funciona a página "Relevantes"?',
      answer: `A página [Relevantes](/) tem como objetivo exibir as publicações recentes que foram mais relevantes para os usuários do TabNews. O algoritmo leva em consideração diferentes fatores como: há quanto tempo a publicação foi feita, quão positivamente ela foi avaliada, se a comunidade engajou por meio de comentários etc.`,
    },
    {
      id: 'sugestoes-e-bugs',
      question: 'Onde posso fazer sugestões e/ou reportar bugs?',
      answer: `Para sugestões de melhorias ou para reportar bugs que não envolvem informações sensíveis ou falhas de segurança, você pode abrir um issue no [repositório do TabNews no GitHub](https://github.com/filipedeschamps/tabnews.com.br).

Caso você descubra alguma falha, brecha ou vulnerabilidade de segurança e encontre **informações sensíveis** (por exemplo, dados privados de outros usuários, dados sensíveis do sistema ou acesso não autorizado), pedimos que [entre em contato de forma privada pelo GitHub](https://github.com/filipedeschamps/tabnews.com.br/security/advisories/new). Você pode seguir [o tutorial do GitHub](https://docs.github.com/pt/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability#privately-reporting-a-security-vulnerability) sobre como fazer esse tipo de relato.

Após o fechamento da falha, o TabNews se compromete em criar um Postmortem público com os detalhes do que aconteceu. Não temos interesse algum em esconder esses acontecimentos e queremos compartilhar todos os conhecimentos adquiridos e estratégias adotadas, mantendo em mente que iremos proteger ao máximo dados sensíveis dos usuários.`,
    },
    {
      id: 'testar-tabnews',
      question: 'Como posso fazer testes no site do TabNews?',
      answer: `Testes das mais variadas formas devem ser feitos no ambiente de homologação. Você pode acessar a [lista de implantações](https://github.com/filipedeschamps/tabnews.com.br/deployments/activity_log?environment=Preview) e clicar em algum link da seção \`Active deployments\` para acessar o ambiente. Por ser um ambiente diferente, você precisará criar uma nova conta e confirmar o e-mail.      `,
    },
    {
      id: 'contribuir-tabnews',
      question: 'Como posso contribuir com o TabNews?',
      answer: `Existem diferentes formas de participação que contribuem para a evolução do TabNews:

- **Criação de conteúdo:** você pode criar publicações ou comentários com conteúdo de valor para outros leitores.
- **Qualificação de conteúdo:** você pode usar seus TabCoins para qualificar as publicações e comentários. Ao qualificar positivamente, você reforça que aquele tipo de conteúdo é relevante e desejado no TabNews. Ao qualificar negativamente, você demonstra que aquele conteúdo não é relevante ou possui algum problema.
- **Participação no repositório:** as sugestões de melhorias e reportes de bugs são realizados no [repositório do TabNews no GitHub](https://github.com/filipedeschamps/tabnews.com.br). Você pode contribuir com detalhes para a resolução de algum problema ou com ideias de implementação de algum recurso.
- **Modificações no código:** como o TabNews é um projeto de código aberto, além de sugerir melhorias e reportar bugs, você também pode contribuir com o código do projeto. Leia o [guia de contribuição](https://github.com/filipedeschamps/tabnews.com.br/blob/main/CONTRIBUTING.md) do projeto para mais detalhes.`,
    },
  ];

  const tableOfContents = faqContent.map((faq) => `- [${faq.question}](#${faq.id})`).join('\n');

  const introduction = `Esta página existe para responder as dúvidas mais frequentes sobre o TabNews.

${tableOfContents}\n`;

  return (
    <DefaultLayout metadata={{ title: 'FAQ - Perguntas frequentes' }}>
      <Box sx={{ width: '100%' }}>
        <Heading as="h1">FAQ - Perguntas Frequentes</Heading>
        <Viewer value={introduction} />
        {faqContent.map((faq) => [
          <Heading
            key={`q-${faq.id}`}
            id={faq.id}
            sx={{
              mt: 3,
              mb: 3,
              borderBottomStyle: 'solid',
              borderBottomWidth: 1,
              borderBottomColor: 'border.default',
            }}>
            <Link href={`#${faq.id}`} sx={{ color: 'fg.default' }}>
              {faq.question}
              <Text sx={{ ml: 2 }}>
                <LinkIcon verticalAlign="middle" />
              </Text>
            </Link>
          </Heading>,
          <Viewer key={`a-${faq.id}`} areLinksTrusted value={faq.answer} />,
        ])}
      </Box>
    </DefaultLayout>
  );
}
