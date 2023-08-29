import { Box, DefaultLayout, Flash, Heading, Link, Viewer } from '@/TabNewsUI';

export default function Page() {
  const body = `<br>

  Para criar boas publicações é importante dentre outras coisas algumas regras de etiqueta na internet:

  - **Não escreva em caixa alta** a menos que realmente seja necessário (exemplo, siglas)
  - **Não escreva grandes trechos em negrito, itálico ou cabeçalho** eles servem para destacar texto e fazer separações de seções
  - **Não faça posts de funil**, posts de funil são posts criados para acessar outra página, a informação no post é propositalmente incompleta tendo o único objetivo de abrir um site externo
  - **Não faça posts sobre assuntos ilegais**, mesmo que seja relacionado a tecnologia e/ou você acredite que deveria ser legal


  #### Dito isso, podemos ver as boas práticas para se criar posts:
  

  1. O título do seu post já é um cabeçalho use isso como auxíxilio
  2. O cabeçalhos servem para você segmentar seu texto
  3. Destaque trechos importantes usando negrito e itálico
  4. Caso for fazer uma citação lembre-se de adicionar uma linha em branco antes e depois:
  5. Em blocos de códigos, lembre-se de adicionar a linguagem
  6. Caso seu código seja muito grande, publique ele em algum lugar e poste o link
  7. Caso esteja postando alguma dúvida, lembre-se de ser o mais descritivo possível
  8. Sempre faça uma revisão clicando em  "Visualizar apenas" (penúltimo botão na barra de ferramentas)

  #### Categorias

  O TabNews não possui um sistema de categorias, ou marcadores, porém adicionar uma das marcações a seguir no título do seu post pode melhorar seu rankeamento:

  - **\`[NEWS]\`** para notícias
  - **\`[DÚVIDA]\`** para perguntas
  - **\`[TUTORIAL]\`** para tutoriais
  - **\`[DICA]\`** para dicas e indicações
  - **\`[CURIOSIDADE]\`** para curiosidades
  - **\`[PITCH]\`** para apresentações de projetos pessoais que você tenha desenvolvido ou participado do desenvolvimento

  #### Considerações finais

  O TabNews prioriza qualidade e não quantidade, então ao invés de fazer 3 post porém com uma qualidade ruim, faça 1 post com boa qualidade, agora que você sabe o que e como publicar, [vamos para a sua publicação!](publicar)
  `;

  return (
    <DefaultLayout metadata={{ title: 'Como fazer boas publicações' }}>
      <Box sx={{ width: '100%', mb: 3 }}>
        <Flash variant="warning">
          Para fazer uma boa publicação é imprescindível ler as {' '}
          <Link href="faq">
            perguntas frequentes
          </Link>{' '}
          elas irão dar dicas sobre o que postar e como postar
         </Flash>
      </Box>
      <Box>
        <Heading as="h1">Como fazer boas publicações</Heading>
        <Viewer value={body} />
      </Box>
    </DefaultLayout>
  );
}
