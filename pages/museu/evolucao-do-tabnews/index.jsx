import { DefaultLayout, Heading, Link, Viewer } from '@/TabNewsUI';

import classes from './index.module.css';

export default function Page() {
  const body = `Muitas pessoas conheceram o TabNews após o [vídeo de lançamento oficial no YouTube](https://www.youtube.com/watch?v=bYBVCxVwrdY), no dia 21/12/2022. Nesta página você encontrará a história anterior. Verá como foi que o TabNews surgiu e evoluiu, quais foram as ideias iniciais, quem participou do processo, quanto tempo levou e até onde conseguiu chegar no momento do lançamento oficial.

  ## 1. Antes de 17/10/2020
  Aqui é onde tudo começa, a origem do projeto. Este foi o <a href="https://github.com/filipedeschamps/tabnews.com.br/wiki/001.-Um-grande-problema">texto</a> que o Filipe Deschamps fez sobre a ideia do TabNews:

  > Tenho uma [Newsletter](https://filipedeschamps.com.br/newsletter) gratuita que faço com meu irmão [Gustavo Deschamps](https://github.com/gustavodeschamps), onde apesar de ter uma aceitação [muito acima do que a gente esperava](https://youtu.be/Jau0Rn_ADxo), ao mesmo tempo é um material que dá **muito trabalho** para ser produzido e ficamos **extremamente frustrados** quando, por exemplo, um mesmo provedor de email decide entregar esse material para alguns usuários, mas não para outros, e sem padrão algum. E por conta disso, decidimos criar o **TabNews** para resolver esse problema, mas **spoiler alert**, não resolve, continue lendo para entender.

  ## 2. 17/10/2020
  No mesmo dia, houve a [compra do domínio](https://github.com/filipedeschamps/tabnews.com.br/wiki/002.-Registro-do-dom%C3%ADnio) [tabnews.com.br](https://www.tabnews.com.br):
  
  > Como todo bom nerd, sem nem mesmo a ideia ter sido completamente formada, a gente foi lá e comprou o domínio [tabnews.com.br](https://tabnews.com.br). Numa breve conversa, chegamos numa ideia de um site que fique atualizado e trazendo **notícias** (news) em tempo-real para que a pessoa deixe ele aberto numa **aba** (tab) no navegador, e com isso o Gustavo sugeriu o nome **TabNews**. O engraçado é que toda hora a gente tentava fugir desse nome, mas a gente não conseguia, é muito simples de entender, decorar e escrever.  
  
  ## 3. 25/12/2020
  A data oficial da criação do [repositório do TabNews no GitHub](https://github.com/filipedeschamps/tabnews.com.br).

  ## 4. 30/12/2020
  A [primeira issue](https://github.com/filipedeschamps/tabnews.com.br/issues/1) foi criada no repositório. Foi uma issue de origem, fala sobre porque o projeto foi criado, de onde o nome veio e outras coisas.

  ## 5. 07/05/2021
  A primeira sugestão de layout para o TabNews:

  ![Uma lista de cards simples, ocupando apenas o lado esquerdo da página. Cada card com título, TabCoins e a data da publicação.](https://user-images.githubusercontent.com/4248081/117865517-e6891680-b24a-11eb-8ba8-fddd4f3f26de.png)
  
  ## 6. 11/05/2021
  O [primeiro pull request](https://github.com/filipedeschamps/tabnews.com.br/pull/2) no repositório: \`layout: trying a more "Twitter" style\`.
  ![Uma lista de cards, cada um com o título e um parágrafo do corpo, TabCoins, quantidade de comentários, data de publicação e autor.](https://i.imgur.com/dXACkkr.png) 
  
  ## 7. Entre 11/05 e 18/05/2021
  Sugestão de layout número 4, desenvolvido pelo Filipe:
  ![Uma lista na metade esquerda da tela, cada item com o título da publicação, TabCoins, data de publicação e autor. Do lado direito, a publicação selecionada e seus comentários.](https://user-images.githubusercontent.com/4248081/118160451-2c70e680-b3d3-11eb-9f6e-96cd1b579811.png)

  No dia 13/05/2021, ao mostrar o layout acima para o Guga e a Renata, [que mencionaram a simplicidade do Hacker News](https://github.com/filipedeschamps/tabnews.com.br/wiki/014.-Guga-e-Renata-tiveram-excelentes-ideias):
  > (...) ao mostrar o HackerNews para a Renata, ela falou que de fato uma coisa legal é ler de forma **linear** as notícias, e não há quebra de linha, o que de fato faz o scan das notícias ser muito rápido. E em cima disso, o Guga tocou em algo muito importante: **o valor dos comentários**.

  Então vieram as próximas sugestões de layout do Filipe, mais próximas da [interface presente no dia do lançamento oficial](https://web.archive.org/web/20221123031951/https://www.tabnews.com.br/).
  ![Uma lista de itens de conteúdos. À esquerda de cada item, a quantidade de TabCoins dentro de um quadrado amarelo. Em cada item, o título, quantidade de comentários, data de lançamento e autor.](https://user-images.githubusercontent.com/4248081/118731117-8ca9c300-b7ed-11eb-8724-dbe921e1c877.png)
  ![Similar à proposta anterior, porém com o início do melhor comentário aparecendo na mesma linha de informações da data de publicação, autor e quantidade de comentaŕios.](https://user-images.githubusercontent.com/4248081/118731136-96332b00-b7ed-11eb-8b94-4835b294b108.png)
  ![Similar à proposta anterior, porém agora existe uma ordem nos conteúdos. O primeiro está em destaque com a quantidade de TabCoins em um retângulo amarelo, o segundo em um retângulo escuro, o terceiro em um marrom e o quarto em diante num cinza claro. Isso faz menção às medalhas de ouro, prata e bronze.](https://user-images.githubusercontent.com/4248081/118731162-a3e8b080-b7ed-11eb-83ba-dcf7229d0ffc.png)
  ![Similar à proposta anterior, porém apenas o primeiro conteúdo está com os TabCoins em destaque (amarelo), os outros são todos cinza claro.](https://user-images.githubusercontent.com/4248081/118731182-b1059f80-b7ed-11eb-9cc0-46559ddf9871.png)

  ## 8. 20/05/2021
  O [primeiro design de dentro da publicação](https://github.com/filipedeschamps/tabnews.com.br/wiki/016.-Layout-de-dentro-da-not%C3%ADcia), numa página própria.
  > Fazendo o layout de dentro da notícia, eu aproveitei para deixar o layout do TabCoins e XP mais discretos e próximos ao que aparece ao lado esquerdo de cada notícia e comentário. E um ponto importante desse layout é que o comentário possui o mesmo espaço e peso que o conteúdo da própria notícia. É importante ser assim, principalmente ter um espaço grande para a pessoa digitar o seu comentário (ter o mesmo espaço que a pessoa teve para criar a notícia principal), como em fóruns antigamente, para que a pessoa possa **trabalhar adequadamente** na criação do conteúdo. Note como o Facebook dá pouco espaço para colocar uma resposta, é um filete, é péssimo para criar conteúdos bem aprofundados e bem pensados. Próximo passo é começar a programar pra valer.
  
  ![Uma página simples, contendo a publicação e os comentários abaixo. A única diferença entre a publicação e cada comentário é que a publicação possui um título. Todos os itens possuem a quantidade de TabCoins ao lado, o autor e data de publicação acima, e um botão para comentar abaixo.](https://user-images.githubusercontent.com/4248081/120021790-61b73000-bfa0-11eb-9fc1-8af0cfafed31.png)
 
  ## 9. 28/05/2021
  Convite feito para os [membros do canal do Filipe no YouTube](https://www.youtube.com/@FilipeDeschamps/membership). Nesse dia, o Filipe postou um vídeo para os membros da turma e até o dia 04/06/2021 **101 pessoas já haviam pedido o acesso ao repositório**, que na época era privado. Destas, 82 pessoas já haviam aceitado. Além disso, várias contribuições foram feitas:
  
  - Sugestão de logo e página inicial:
  ![Os logos envolvem as letras TN ou o símbolo de Tab do teclado, uma seta para a esquerda acima de uma seta para a direita. A página inicial lembra um site de notícias.](https://user-images.githubusercontent.com/4248081/123183286-1d576c80-d446-11eb-9fea-363d5b5825e3.png)
  
  - Modo noturno para o site:
  ![Uma das propostas feitas pelo Filipe, mas no modo escuro.](https://user-images.githubusercontent.com/4248081/123183178-d6697700-d445-11eb-9f3f-c6cccb3b842a.png)
 
  - [Sugestão de extensão](https://github.com/filipedeschamps/tabnews.com.br/issues/3) do TabNews pra navegadores
  - Outra sugestão da página inicial:
  ![Uma coluna à direita contendo o nome do usuário, a quantidade de TabCoins, notificações e o que está ouvindo. Do lado principal, três publicações em destaque com imagem na parte superior, e uma lista de publicações abaixo.](https://user-images.githubusercontent.com/4248081/123183605-b7b7b000-d446-11eb-9393-01dd85748d00.png)
 
  ## 10. 11/06/2021
  Mais uma série de sugestões de design:
  ![Uma lista de publicações em formatos de card, exibindo a quantidade de TabCoins, o título da notícia, o comentário principal, o autor, data de publicação e opção de comentar. Cada card é bem grande, cabendo apenas três na tela.](https://user-images.githubusercontent.com/4248081/123184246-25181080-d448-11eb-8d88-3aceb040b3c1.png)
  ![Se diferencia no fundo cinza e um destaque maior para a primeira publicação da lista, em um gradiente amarelo. As outras publicações estão num gradiente cinza e branco.](https://user-images.githubusercontent.com/4248081/123184265-2fd2a580-d448-11eb-8b0e-aede0a727538.png)
  ![Duas sugestões: a primeira é uma lista simples, apenas com cards contendo o título e a descrição; a outra é parecida, mas com TabCoins, autor, data da publicação, quantidade de comentários e reações de coração.](https://user-images.githubusercontent.com/4248081/123184461-96f05a00-d448-11eb-916d-ab931f35c5de.png)
  
  E algumas contribuições não visuais:
  - [Novos Hooks e Lazy Loading de Componentes](https://github.com/filipedeschamps/tabnews.com.br/pull/9)
  - [Sistema de TabCoins](https://github.com/filipedeschamps/tabnews.com.br/issues/11)
  - [Proposta de Arquitetura](https://github.com/filipedeschamps/tabnews.com.br/issues/12)
  - [Suporte a PWA](https://github.com/filipedeschamps/tabnews.com.br/issues/16)
  
  ## 11. 24/06/2021
  Antes do encerramento da Milestone 0, [o Filipe compartilhou](https://github.com/filipedeschamps/tabnews.com.br/wiki/021.-Cross-collaboration) como estava sendo a experiência no repositório com tantas pessoas:
  > Hoje já estamos com **224 pessoas** dentro do repositório e **muitas contribuições** aconteceram nesse meio tempo. Depois da Live de inauguração da Milestone 0, a turma atacou as issues, como por exemplo [essa em que bolamos várias ideias para a página "Em Construção"](https://github.com/filipedeschamps/tabnews.com.br/issues/23), e ideias extras sobre [fakenews](https://github.com/filipedeschamps/tabnews.com.br/issues/27), [internacionalização](https://github.com/filipedeschamps/tabnews.com.br/issues/35) e [acessibilidade](https://github.com/filipedeschamps/tabnews.com.br/issues/43). Só que algo **especial** aconteceu [nesse Pull Request](https://github.com/filipedeschamps/tabnews.com.br/pull/45) onde implemento uma sugestão para a página de "Em construção", olha que interessante: eu fiz uma implementação, o Membro [@rhandrade](https://github.com/rhandrade) encontrou e isolou um bug, e outro Membro [@rodrigoKulb](https://github.com/rodrigoKulb) implementou um fix... e foi tudo **muito rápido**. E eu pessoalmente achei especial porque se eu tivesse sozinho nesse repositório, nada disso teria acontecido. Eu sinceramente espero que esse repositório do TabNews abra mais oportunidades assim para trabalharmos juntos, cada um conseguindo observar e participar em algum ponto do serviço. Se conseguirmos manter essas coisas acontecendo, no longo prazo iremos construir algo **realmente especial**. Bom, a Live de encerramento e comemoração da Milestone 0 supostamente irá acontecer amanhã, vamos ver como vai ser... eu to empolgado e queria que fosse hoje já!!!

  E no dia 25/06/2021, houve o [encerramento da Milestone 0](https://github.com/filipedeschamps/tabnews.com.br/wiki/022.-Milestone-0-(ENCERRAMENTO)) e a primeira página oficial do TabNews. Uma página simples, mas com a foto do perfil de todos que estavam participando do projeto no GitHub naquela época. Você pode acessar essa página ainda hoje, e ela é chamada de [init](/museu/init.html).
  ![Um texto explicando a construção do TabNews e a foto de todos que colaboraram no GitHub.](https://user-images.githubusercontent.com/4248081/123689581-38402d00-d808-11eb-8def-71601dacc6b7.png)

  ## 12. 30/07/2021
  [Encerramento da Milestone 1](https://github.com/filipedeschamps/tabnews.com.br/wiki/023.-Milestone-1-(ENCERRAMENTO)).

  ## 13. 15/12/2021
  O Filipe escreveu sobre a reorganização na sua vida para conseguir continuar o TabNews, e destacou que mesmo nessa fase conturbada, os membros do repositório continuaram contribuindo:
  
  > Os últimos meses foram os mais diferentes da minha vida, tanto pelo fato de estar criando um Bebê, quanto por reorganizar todo o trabalho com o canal no YouTube para que a publicação de vídeos seja feita de uma forma mais consistente.
  > 
  > Para isso, no início de Outubro eu postei um vídeo anunciando que estava procurando uma pessoa para editar os vídeos do canal, algo que eu pensei que nunca iria terceirizar, ou que pelo menos isso era algo que estava muito distante de acontecer. E no meio do caminho, outra pessoa apareceu para ajudar na parte de roteiros, o que foi outra novidade. E trabalhar com essas duas pessoas está sendo uma ótima experiência, principalmente para **profissionalizar** a produção de conteúdo no canal, que basicamente estava sendo feita só por mim e de uma forma muito pessoal e pouco escalável, vamos colocar assim.
  >
  > Então sem a ajuda dessas pessoas, tocar 3 projetos (Bebê, Canal e TabNews) se tornou inviável, principalmente tocar de uma forma saudável. Então a batalha agora é retomar o YouTube com força total, e ainda fazer sobrar espaço e tempo de qualidade para o TabNews, que é um projeto que cada dia que passa se torna **mais necessário existir**. A importância dele **só aumentou** e é um sonho meu e do Guga ter esse espaço na internet para pessoas **boas** terem conversas **saudáveis** sobre a produção de tecnologia. O bom é que cada vez mais estou ficando empolgado porque parece que vai ser possível com essa nova organização. A ideia é sempre trabalhar em "batches", em levas, onde antes eu escrevia 1 roteiro, depois gravava ele, depois editava e publicava... e agora o que fizemos nos últimos meses foi escrever vários roteiros, depois gravar eles em sequência, editar em sequência e publicar. Todo esse material estamos acumulando para o próximo ano (2022), inclusive tem mais roteiro escrito do que gravado e editado, e isso é ótimo.
  >
  > Em paralelo, **o projeto aqui andou** com contribuições fundamentais, por exemplo:
  >
  > 1. [Padronização inicial dos Controllers](https://github.com/filipedeschamps/tabnews.com.br/pull/119)
  > 2. [Script para Migration](https://github.com/filipedeschamps/tabnews.com.br/pull/121)
  > 3. [Adiciona migration de "uuid-ossp" e "user"](https://github.com/filipedeschamps/tabnews.com.br/pull/127)
  > 4. [Padronização dos Erros](https://github.com/filipedeschamps/tabnews.com.br/pull/131)
  > 5. [Cria endpoint /status](https://github.com/filipedeschamps/tabnews.com.br/pull/136)
  > 6. [Refatora os Github Actions para aproveitar cache](https://github.com/filipedeschamps/tabnews.com.br/pull/144)
  
  ## 14. 18/03/2022
  Quando as primeiras contas foram criadas, sem uma página de cadastro, diretamente pela API em REST.

  ## 15. 05/04/2022
  A criação da página de cadastro.

  ## 16. 06/04/2022
  Sistema de recuperação de conta e ativação.

  ## 17. 07/04/2022
  A criação da página de login.

  ## 18. 20/04 a 27/04/2022
  Nesse período, muitas coisas aconteceram:
  - [CRUD de \`content\` - Primeira versão do \`GET\`](https://github.com/filipedeschamps/tabnews.com.br/pull/268).
  - [\`content\`: implementa primeira versão do \`POST\`](https://github.com/filipedeschamps/tabnews.com.br/pull/269).
  - [\`content\`: implementa primeira versão do \`PATCH\`](https://github.com/filipedeschamps/tabnews.com.br/pull/272).
  - [\`content\`: Implementa quase todos os endpoints \`GET\`](https://github.com/filipedeschamps/tabnews.com.br/pull/275).
  - [\`content\`: método e endpoint para listar conteúdos filho](https://github.com/filipedeschamps/tabnews.com.br/pull/277).
  - [Implementa Design System do GitHub (Primer)](https://github.com/filipedeschamps/tabnews.com.br/pull/278).
  - [Normaliza todos os layouts e adiciona endpoint \`/user\`](https://github.com/filipedeschamps/tabnews.com.br/pull/279).

  ## 19. 02/05/2022
  A primeira interface foi implementada, assim como outras atualizações:
  - **Remoção do \`tailwindcss\`:** Ele foi completamente substituído pelo [@primer/react](https://primer.style/react/).
  - **Padronização das páginas com o Primer:** Nesse ponto, todas as páginas passaram a usar o Primer.

  ### \`/cadastro\`
  ![A página seguindo o mesmo estilo do GitHub, com campo para nome de usuário, email e senha, e o botão para "Criar Cadastro".](https://user-images.githubusercontent.com/4248081/166298154-392d8f5f-14d7-4d4e-8e29-9316bb700ec2.png)
  
  Com erro de validação no formulário:
  ![Erro no campo de nome de usuário, com um texto em vermelho abaixo do campo.](https://user-images.githubusercontent.com/4248081/166298265-e97f6382-f658-42d8-b371-b22372a300fd.png)
  
  ### \`/publicar\`
  Com conteúdo preenchido
  ![A página de criação de conteúdo com campo para título, corpo e fonte, nenhum campo possui label, e o botão "Publicar".](https://user-images.githubusercontent.com/4248081/166298807-c60117f7-4c89-4f8c-8afb-cc7ac681d3a1.png)
  
  ### \`/[username]/[slug]\`
  Estando logado, com o botão \`...\` para editar o conteúdo:
  ![A publicação com bordas finas, contento o nome de usuário, tempo de publicação, título, conteúdo e fonte, sem TabCoins, e com botão para Responder numa seção abaixo da publicação.](https://user-images.githubusercontent.com/4248081/166298960-16eba776-5367-455c-81c6-e7977f95ec29.png)
  
  Respondendo:
  ![O botão "Responder" desapareceu, e uma caixa de edição de texto surgiu, com o botão "Publicar" abaixo.](https://user-images.githubusercontent.com/4248081/166299317-6b6525a6-c11b-4a6e-bdb5-785e8f2da928.png)
  
  Após responder:
  ![O comentário aparece como se fosse uma nova publicação, porém sem título e fonte.](https://user-images.githubusercontent.com/4248081/166299393-70f6d962-8854-4440-b576-e6ece0fc26e5.png)
  
  ### Página exclusiva da resposta
  Cada comentário tem a data em que foi publicado. Ao passar o mouse em cima, mostra o horário sem formatação de distância de tempo:
  <img alt="O texto '4 segundos atrás', com o mouse em cima mostra um Tooltip com o texto 'segunda-feira, 2 de maio de 2022 10:54'" src="https://user-images.githubusercontent.com/4248081/166299676-ffacbbd6-6276-44e2-8b28-a141d47122ac.png" width="300" />
  
  Ao clicar na data em que o comentário foi publicado, a página do próprio comentário:
  ![Uma página em que o comentário toma o lugar de destaque, como se fosse uma publicação raiz, mas acima dele existe o texto "Em resposta a <título da publicação original>"](https://user-images.githubusercontent.com/4248081/166299828-f05226aa-4b21-4020-bf06-fa42971e1904.png)
  
  ### Respondendo a resposta de uma resposta:
  ![Uma árvore de comentários, indentados para passar a noção de aninhamento, além das bordas cinzas que cada comentário possui, ficando uma caixa dentro da outra.](https://user-images.githubusercontent.com/4248081/166300415-1074823f-8405-454d-8bf9-2b700a743586.png)
  
  ### Integração com diagramas Mermaid
  ![Criando uma publicação com código para diagramas Mermaid.](https://user-images.githubusercontent.com/4248081/166302793-3df93094-cb94-4fce-8599-435027828fd2.png)
  ![A publicação criada, com um fluxograma simples.](https://user-images.githubusercontent.com/4248081/166302860-8ac165e5-7755-417e-a6cf-7860b722a65d.png)
  ![Um diagrama de sequência com o Mermaid.](https://user-images.githubusercontent.com/4248081/166302939-612a8f84-7f02-4157-aea5-53a8f0076a5c.png)
  
  ### \`/[username]\`
  Cada usuário possui um endereço na raiz do site.
  ![Página do usuário, contendo apenas sua lista de publicações.](https://user-images.githubusercontent.com/4248081/166300942-bd9e726b-db5a-4c6a-ad15-bc0f6fb39ff4.png)
  
  ### Tudo acessível pela API por padrão \`/api/v1/contents/\`
  A URL do primeiro conteúdo criado era \`/filipedeschamps/isso-daqui-e-o-titulo-de-um-novo-conteudo-raiz\`, e a chamada à API era \`/api/v1/contents/filipedeschamps/isso-daqui-e-o-titulo-de-um-novo-conteudo-raiz\`. A API retorna o exato mesmo conteúdo e isso possibilita a integração e criação de qualquer client, script ou automação que as pessoas queiram criar:
  ![O JSON retornado pela API.](https://user-images.githubusercontent.com/4248081/166302106-23060107-d543-436c-a60b-0797a24c4d0d.png)

  ## 20. Depois do dia 04/05/2022
  Dia 04/05 houve a primeira publicação em produção.
  ![A primeira publicação.](https://i.imgur.com/kQVpMyj.png)
  ![A página inicial, contendo a lista de publicações.](https://i.imgur.com/zoa4rvl.png)

  ## 21. 16/05/2022
  A primeira listagem de conteúdos não possuía paginação, então mostrava todas as publicações do TabNews.
  ![Mostrando até a publicação de número 118](https://i.imgur.com/4Tk2dWN.png) 

  E nesse dia, também foi criada a primeira publicação \`Pitch\`:
  ![Título: "Pitch: App que ajuda a identificar algoritmos de hashing feito em Rust!"](https://i.imgur.com/8nY6gtn.png)

  ## 22. 28/05/2022
  Foi adicionada paginação ao site, ou seja, cada página mostra até 30 publicações.

  ## 23. 03/06/2022
  Adição dos TabCoins e TabCash, com o anúncio na publicação [Nova melhoria: TabCoins, TabCash e Melhorias no Layout 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-tabcoins-tabcash-e-melhorias-no-layout).

  ## 24. 21/11/2022
  **O dia do lançamento oficial**. Depois de 6 meses em beta, o tão esperado lançamento foi feito! Foi o primeiro dia em que o TabNews ficou com problemas de instabilidade, por causa da alta quantidade de acessos e falta de índices no banco de dados, e isso foi discutido no issue [Vídeo de lançamento conseguiu derrubar a API (mais ou menos) 🤝](https://github.com/filipedeschamps/tabnews.com.br/issues/826) no repositório do GitHub. 
  ![O site com o aviso de modo leitura: "Turma, dado ao alto volume de acessos precisamos temporariamente desativar a nossa API, mas estamos trabalhando para voltar o mais rápido possível :) então por enquanto o TabNews está somente no modo leitura, combinado? 🤝"](https://user-images.githubusercontent.com/4248081/203150458-b4ea9d2a-880f-4552-a437-4b5c689febcd.png)

  E mesmo com todas as instabilidades, API ter ficado fora do ar e o vídeo ter ficado como não listado durante um tempo, no primeiro dia foram feitos impressionantes **1884 cadastros**, mais de **130 publicações** e **506 comentários**.
  
  ## As melhorias
  Ao longo desse período, várias publicações de melhorias foram feitas pelo Filipe no TabNews:
  1. [Nova melhoria: Recuperação de Senha 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-recuperacao-de-senha)
  2. [Nova melhoria: Refatoração e novos comportamentos no Editor de Markdown 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-refatoracao-e-novos-comportamentos-no-editor-de-markdown)
  3. [Nova melhoria: Melhorias de tags para SEO e redes sociais (e largura das colunas) 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-melhorias-de-tags-para-seo-e-redes-sociais-e-largura-das-colunas)
  4. [Nova melhoria: Paginação na API e no Site 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-paginacao-na-api-e-no-site)
  5. [Novas melhorias: Remoção do "flicker" na data, posição dos números, Node.js 16 LTS, source_url, ícone Dark Mode e Nova Paginação 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-remocao-do-flicker-na-data-posicao-dos-numeros-node-js-16-lts-sourceurl-e-nova-paginacao)
  6. [Novas melhorias: habilidade de apagar suas publicações (e edição pela moderação) 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-habilidade-de-apagar-suas-publicacoes-e-edicao-pela-moderacao)
  7. [Novas melhorias: número de comentários nas publicações (+SEO) 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-numero-de-comentarios-nas-publicacoes)
  8. [Novas melhorias: Husky, Sistema de Eventos, Firewall e Melhorias no SEO 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-husky-sistema-de-eventos-firewall-e-melhorias-no-seo)
  9. [Nova melhoria: aumento de performance para usuários logados (última tarefa antes das TabCoins) 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-aumento-de-performance-para-usuarios-logados-ultima-tarefa-antes-das-tabcoins)
  10. [Nova melhoria: TabCoins, TabCash e Melhorias no Layout 🎉](https://www.tabnews.com.br/filipedeschamps/nova-melhoria-tabcoins-tabcash-e-melhorias-no-layout)
  11. [Novas melhorias: Enviar publicações com "CTRL + Enter" e outras 6 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-enviar-publicacoes-com-ctrl-enter-e-outras-6-melhorias)
  12. [Novas melhorias: Thumbnail dinâmica, Ícones do Bot do TabNews e outras 5 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-thumbnail-customizada-icones-do-bot-do-tabnews-e-outras-5-melhorias)
  13. [Novas melhorias: feature de Deslogar implementada e mais 6 melhorias! 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-feature-de-deslogar-implementada-e-mais-6-melhorias)
  14. [Novas melhorias: Abertura instanânea de páginas e mais 7 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-abertura-instananea-de-paginas-e-mais-7-melhorias)
  15. [Novas melhorias: RSS e mais 7 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-rss-e-mais-7-melhorias)
  16. [Novas melhorias: Mais Performance e outras 6 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-mais-performance-e-outras-6-melhorias)
  17. [Novas melhorias: Mais contexto nas notificações por Email e outras 8 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-mais-contexto-nas-notifacoes-por-email-e-outras-8-melhorias)
  18. [Novas melhorias: TabCoins mais consistentes e outras 4 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-tabcoins-mais-consistentes-e-outras-4-melhorias)
  19. [Novas melhorias: Editar Perfil e outras 4 melhorias 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-editar-perfil-e-outras-4-melhorias)
  20. [Novas melhorias: Não de código, mas teve sobre o Vídeo de Lançamento do TabNews 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-nao-de-codigo-mas-teve-sobre-o-video-de-lancamento-do-tabnews)
  21. [Novas melhorias: testando novo algoritmo de ranking (3 versões disponíveis) 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-testando-novo-algoritmo-de-ranking-3-versoes-disponiveis)
  22. [Novas melhorias: Novo Algoritmo de Ranqueamento e mais 3 melhorias (+1 Breaking Change) 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-novo-algoritmo-de-ranqueamento-e-mais-3-melhorias-1-breaking-change)
  23. [Novas melhorias: 3 ajustes + Commit no Core do Next.js 🎉 (e peguei COVID)](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-3-ajustes-commit-no-core-do-next-js-e-peguei-covid)
  24. [Novas melhorias: 3 ajustes (incluindo novo Analytics) 🎉](https://www.tabnews.com.br/filipedeschamps/novas-melhorias-3-ajustes-incluindo-novo-analytics)
  25. [Repositório do TabNews no GitHub disponibilizado de forma Pública 🎉](https://www.tabnews.com.br/filipedeschamps/repositorio-do-tabnews-no-github-disponibilizado-de-forma-publica)

  ## Mais história
  Se você quiser ver como era a interface do TabNews em diferentes épocas, pode acessar a [Wayback Machine](http://web.archive.org/web/20220000000000*/tabnews.com.br) e acessar os dias em que o site do TabNews foi arquivado.

  Se deseja ver todas as sugestões de design elaboradas antes da primeira interface, pode acessar o [Museu do TabNews](/museu).

  Durante o desenvolvimento, o Filipe fez um [Diário de desenvolvimento](https://github.com/filipedeschamps/tabnews.com.br/wiki) no Wiki do GitHub compartilhando seus pensamentos e decisões tomadas. Várias informações desta página foram retiradas do diário.
`;

  return (
    <DefaultLayout metadata={{ title: 'A Evolução do TabNews — da Concepção ao Lançamento' }}>
      <article>
        <Heading as="h1">A Evolução do TabNews — da Concepção ao Lançamento</Heading>
        <div className={classes.Author}>
          <div className={classes.AuthorLine}>
            <address className={classes.Address}>
              <span>Autor: </span>
              <Link href="https://github.com/gabrielsozinho">Gabriel Sozinho</Link>
            </address>
            {' · '}
            <span>Revisor: </span>
            <Link href="https://github.com/rafatcb">Rafael Tavares</Link>
          </div>
        </div>
        <Viewer areLinksTrusted value={body} clobberPrefix="" />
      </article>
    </DefaultLayout>
  );
}
