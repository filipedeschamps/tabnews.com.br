import { Box, DefaultLayout, Heading, Viewer } from '@/TabNewsUI';

export default function Page() {
  const body = `É normal que você tenha perguntas sobre a plataforma, aqui nós respondemos algumas para você

  <details>
    <summary><b><big>Como pesquisar conteúdos?</big></b></summary>
    <br>
    O TabNews possui uma barra de busca, para utilizar:
    <br>
    <ol>
      <li>Clique em "Pesquisar" (icone de lupa em smartphones/tablets) no canto superior esquerdo</li>
      <li>Digite os termos que deseja pesquisar</li>
      <li>Pressione Enter</li>
    </ol>
    Feito isso os resultados devem aparecer
  </details>

  ----

  <details>
    <summary><b><big>O que postar?</big></b></summary>
    <br>
    O TabNews tem como objetivo principal servir como plataforma para <b>conteúdos de valor concreto</b> para quem trabalha com <b>Programação</b> e <b>Tecnologia</b> sendo assim, são apreciados:
    <br>
    <ul>
      <li><b>Notícias</b>, sendo imprescindível ser algo verdadeiro de fontes verificadas</li>
      <li><b>Articos, tutoriais e dicas</b>, originais não sendo apenas cópia de outro existente (mesmo com IAs generativas a menos que seja para ilustrar conceitos)</li>
      <li><b>Indicações e Curiosidades</b>, relacionadas ao mundo da tecnologia e programação</li>
      <li><b>Projetos que você desenvolveu</b> e que é de alguma forma relacionado ao mundo da tecnologia e programação</li>
      <li><b>Perguntas bem formuladas</b></li>
    </ul>
    Sobre apresentações, use o campo <a href="perfil">Descrição</a> no seu perfil Contamos com a sua ajuda para manter o TabNews o lugar mais massinha da internet :)
  </details>

  ----

  <details>
    <summary><b><big>O que é uma pergunta bem formulada?</big></b></summary>
    <br>
    Uma pergunta bem formulada evita as seguintes características
    <br>
    <ul>
      <li><b>Pede para perguntar (ask-to-ask)</b>, pedir para perguntar significa fazer uma pergunta, por exemplo "Tem algum desenvolvedor Javascript aqui?" ao invés de fazer a pergunta diretamente, por exemplo "Como eu faço para fazer uma requisição post em Javascript?"</li>
      <li><b>Diz apenas uma apresentação sua</b>, por exemplo "Olá sou Fulano, sou desenvolvedor C++ e preciso de dicas"</li>
      <li><b>Induz ao problema XY</b>, isso significa perguntar sobre a sua solução ao invés do problema em si, perceba que essa é uma forma diferente de perguntar sobre uma solução, o problema XY é o seguinte
        <ul>
          <li>Você deseja fazer X mas não sabe</li>
          <li>Acha que consegue o mesmo resultado fazendo Y</li>
          <li>Você também não sabe fazer Y</li>
          <li>Você pergunta sobre Y e não sobre X</li>
        </ul>
        Isso vai diminuir consideravelmente as chances de obter ajuda com o seu problema real
      </li>
    </ul>
  </details>

  ----

  <details>
  <summary><b><big>Como funcionam os votos?</big></b></summary>
  <br>
  O TabNews não possui algoritmo individualizado, sendo assim, o ideal é pensar como uma comunidade, por isso sugerimos a seguinte lógica:
  <br>
  <ol>
    <li><b>Se o contéudo não cumpre o que se espera para o TabNews</b>, vote -1</li>
    <li><b>Se o conteúdo cumpre o que se espera para o TabNews</b>, vote +1</li>
  </ol>
  Algo importante a se ressaltar é que os votos são "Relevante" e "Não relevante", não existindo o conceito de "Gostei" e "Não gostei" quando você avalia um conteúdo, procure pensar que você está avaliando algo para a comunidade TabNews e não apenas para você, e inclusive você
  é recompensado tanto por produzir conteúdo através das TabCoins, quanto por avaliar através das TabCash, então faça um uso conciente, lembre-se <i>"Com grandes poderes, vem grandes responsabilidades"</i>
</details>

----

  
  `;

  return (
    <DefaultLayout metadata={{ title: 'Perguntas frequentes' }}>
      <Box>
        <Heading as="h1">Perguntas frequentes</Heading>
        <Viewer value={body} />
      </Box>
    </DefaultLayout>
  );
}
