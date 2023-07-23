import { Box, DefaultLayout, Heading, Viewer } from '@/TabNewsUI';

export default function Page() {
  const body = `Aqui estão algumas dicas para evitar que seus posts sejam negativados, **não** é obrigação seguir mas certamente vão reduzir as chances do seu post ser negativado, peço que leia até o final:

## Aqui no TabNews nós como **comunidade** valorizamos

- Notícias (lembre-se de citar uma fonte confiável e verificar se a notícia é verdadeira)
- Artigos
- Tutoriais
- Indicações (lembre-se de citar os motivos)
- Curiosidades
- Perguntas bem formuladas 

> **Note** <br> que essa é uma plataforma focada em quem trabalha em áreas diretamente ou indiretamente relacionadas ao desenvolvimento de software.

## Mais algumas sugestões
  
1. Não escreva em caixa alta, tudo em negrito, ou em cabeçalho, isso na internet é visto como falta de educação
2. Não poste apenas um link, faça pelo menos um resumo
3. Se for apresentar algo, coloque [PITCH] no começo do título isso vai fazer com que a maioria das pessoas não interprete como algo só pra se promover
4. Não use IAs para escrever seu texto, IAs geralmente fazem textos inchados e desconexos, mesmo que para você pareça um bom texto
  

## Agora que você leu isso, [continue a publicação!](https://www.tabnews.com.br/publicar)

  `;

  return (
    <DefaultLayout metadata={{ title: 'Guia rápido sobre o que publicar' }}>
      <Box>
        <Heading as="h1">Guia rápido sobre o que publicar</Heading>
        <Viewer value={body} />
      </Box>
    </DefaultLayout>
  );
}
