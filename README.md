# tabnews.com.br

## **Novidades!**
**[30/07/21 - Milestone 1 (ENCERRAMENTO)](pages/init/diary/2021-07-30.md)**

## Diário

- [Antes de 17/10/20 - Um grande problema](pages/init/diary/2020-10-16.md)
- [17/10/20 - Registro do domínio](pages/init/diary/2020-10-17.md)
- [25/12/20 - Criação do repositório](pages/init/diary/2020-12-25.md)
- [30/12/20 - Primeira issue e a descoberta de algo importante](pages/init/diary/2020-12-30.md)
.  
.  
.  
.
- [30/07/21 - Milestone 1 (ENCERRAMENTO)](pages/init/diary/2021-07-30.md)

### 14/01/21 - Revenue Share

Essa é a parte **mais empolgante do projeto**, até porque tanto eu quanto o Gustavo **não queremos ficar acima do sistema** e vamos participar do exato mesmo Revenue Share que todo mundo está participando, até para entender na pele o que está funcionando e o que deveria ser melhorado. Claro que em algum momento iremos implementar uma divisão de custos de servidor e manutenção do projeto, mas isso precisa ficar no futuro e somente após o modelo de Revenue Share **estar funcionando** para quem está criando conteúdo de fato (e por conteúdo entenda **notícias** ou **comentários** que adicionam valor para quem está lendo). E o jeito que isso vai ser feito é bastante interessante, mas vamos deixar para desenvolver mais para frente.

### 15/01/21 - Cultura

Nós queremos dar um 180 graus e ir na **contramão** do que está acontecendo atualmente nas redes sociais e voltar com o espírito dos **fóruns** de antigamente, onde era possível ter conversas bem elaboradas, profundas e uma thread (tópico) composta por várias respostas que muitas vezes valia mais do que qualquer artigo no assunto. Então nós vamos estabelecer, custe o que custar, que a cultura do TabNews seja de pessoas **brutalmente exatas e empáticas, simultaneamente**. Sugiro você parar para pensar por alguns minutos como estes dois pontos, quando levados ao máximo simultaneamente conseguem criar interações **extremamente valiosas** para quem está participando de uma discussão. Então colado a isso, é aqui que entra uma mecânica importante: **nós vamos desestimular comentários simples**, como por exemplo um agradecimento _"ah valeu! falou"_ em favor de comentários que devolvam algum valor concreto, e caso isso não seja possível, devolva **valor** ao autor do comentário ou post através das **TabCoins**.

### 17/01/21 - TabCoins

Diferente de sites como o Reddit onde você pode **comprar** moedas virtuais utilizando dinheiro real, o TabNews **nunca irá abrir margem para compra de TabCoins** e a **única forma** de adquirir elas é gerando **valor concreto** através da publicação de notícias, artigos, tutoriais ou comentários. O recebimento das moedas irá acontecer tanto no ato da criação desses materiais, quanto na troca/agradecimento de pessoas que possuem moedas e querem sinalizar que o seu post/comentário possui valor. Então ao invés de uma mecânica de **like** em que numa rede social convencional você pode infinitamente colocar 1 em cada post que quiser (pois o seu saldo de like não vai acabar), no TabNews a sinalização de valor não é banalizada, e sempre herda de algum valor prévio **concreto**. Inicialmente eu pensei que as pessoas poderiam utilizar as mesmas TabCoins para participar do Revenue Share, mas isso não seria o incentivo correto, pois isso estimularia elas a **guardarem** as moedas para maximizar o Revenue Share, ao invés de **investir** elas em posts ou comentários com valor concreto e contribuir com outros criadores. Então para esse ecossistema parar em pé, precisamos de um **vetor contrário**, um vetor que gere a mecânica dos pistões de um motor (quando um desce, o outro sobe) e aí o negócio vai pra frente.

### 01/02/21 - XP

Como incentivo para a pessoa investir as suas moedas em conteúdos com valor concreto, cada vez que ela faz isso, os seus Experience Points (XP) irão aumentar e liberar **novos recursos** no site e **aumentar a sua participação** no Revenue Share. Por exemplo, inicialmente a pessoa terá apenas permissão para postar comentários, e não poderá criar conteúdos como notícias ou artigos no feed principal. Ao participar do **fluxo completo de contribuição** (ao contribuir com comentários de valor, receber e gastar moedas), seu XP irá aumentar ao ponto de atingir a faixa de alguém que pode criar postagens no feed principal. E isso vai valer para qualquer outra feature que algum usuário possa ter. E esse caminho é importante, porque como destacado no item anterior, moedas não podem ser compradas, como consequência XP não pode ser comprado e como consequência o único caminho para evoluir dentro do site e ganhar espaço no Revenue Share é através de contribuições de valor concreto. E algo extremamente importante de deixar explícito, é que com isso empresas **não vão poder comprar anúncios dentro do site**. Se elas quiserem ter um espaço, vão precisar participar do fluxo completo de contribuição. Isso não quer dizer que nunca haverá espaço para um patrocícino, mas com certeza ele **não será convencional** e queremos ao máximo que o espaço publicitário do site seja dos próprios usuários que criam conteúdo.

### 04/05/21 - Tecnologias

Esta é uma visão geral, mas de uma forma grosseira vou tentar resolver todo backend e frontend com Next.js e guardar os dados no PostgreSQL.

- **Frontend**

  - Framework Front (React/Next.js)
  - Framework CSS (Tailwindcss)
  - Comunicação com Backend (SWR)

- **Backend**

  - Framework Backend (Next.js)
  - Comunicação com Banco (pg)
  - Autenticação (login/senha ou NextAuth.js via Github)
  - Autorização (???)

- **Banco**

  - RBDMS (PostgreSQL)
  - Instância Dev (Docker)
  - Instância CI (Docker)
  - Instância Production (AWS / DigitalOcean)
  - Migration (node-pg-migrate)

### 05/05/21 - Bootstrap do projeto

Iniciei o código pela instalação das dependências que eu quero usar, configurei o Tailwind CSS e fiz um rabisco da home só para ver se os estilos estavam sendo aplicados com sucesso. Agora é questão de começar a fazer o draft da Home.

### 07/05/21 - Primeiro draft da lista de notícias

Instalei o módulo `react-icons` e ta sendo uma experiência muito legal buscar e importar ícones. Terminei a primeira versão do draft da lista de notícias na Home, to super inseguro e não sei ainda se vai ficar legal um layout em tela cheia, ou um layout com largura fixa.

![image](https://user-images.githubusercontent.com/4248081/117865517-e6891680-b24a-11eb-8ba8-fddd4f3f26de.png)

### 10/05/21 - Mudança de abordagem

Tive um insight hoje: para aumentar as chances do TabNews dar certo, ele precisa ter o potencial de conseguir **matar a Newsletter**. Não que isso vá acontecer, mas é melhor você se **"autocanibalizar"** do que outra pessoa consiga e a direção que o layout estava tomando era de um site convencional. Isso me deixou pensando bastante, porque isso não "mexe o ponteiro" das pessoas. A Newsletter mexeu o ponteiro porque ela teve uma abordagem **corajosa**... ela tem uma postura que, ou vai deixar as pessoas satisfeitas ou insatisfeitas, mexendo para algum lado o ponteiro. Isso é importante em qualquer projeto. Então depois de pensar bastante, eu decidi tentar uma outra abordagem: ao invés de fazer o clássico item com título e conteúdo, usar o mesmo princípio das notícias sintetizadas e montar um site em cima disso. E sabe o que isso lembra? O Twitter... então a próxima abordagem vai ser tentar fazer um layout mais próximo do Twitter e tentar fazer o site ser um "Twitter de nicho" onde as notícias vão entrando de forma sintetizada, mas que possam ser expandidas nos comentários. E as mecânicas anteriores de TabCoins e XP continuam a mesma. Vamos ver se o negócio para em pé.

### 11/05/21 - Está difícil de se autocanibalizar

Por algum motivo, não estou conseguindo fazer a versão "site" dos conteúdos que são enviados na Newsletter ser tão gostoso de ler quanto nos emails. Será que o mindset de uma pessoa **lendo** um email, é diferente de uma pessoa **vendo** um site? Essas palavras são importantes, uma pessoa talvez não vê um email, ela **lê** um email, e um site (a home pelo menos) a pessoa quer **ver**, e ver as informações de forma rápida para daí escolher o que ler. Bom, segue abaixo duas tentativas, e vou agora tentar algo próximo ao Hackernews.

![image](https://user-images.githubusercontent.com/4248081/117865372-c194a380-b24a-11eb-9e7f-b0b4faec468a.png)

![image](https://user-images.githubusercontent.com/4248081/117865400-c9ecde80-b24a-11eb-8f70-8352f16a778d.png)

### 13/05/21 - Guga e Renata tiveram excelentes ideias

Nos últimos dias eu estava desenhando o layout abaixo, tentando encaixar na home tanto a lista de notícias quanto já aberta a notícia principal e apesar de que é uma ideia interessante de ser explorada, na avaliação do Guga o primeiro impacto ficou muito confuso, muita informação, e eu pessoalmente também não gosto de ler coisas na direita. De qualquer forma, ao mostrar o HackerNews para a Renata, ela falou que de fato uma coisa legal é ler de forma **linear** as notícias, e não há quebra de linha, o que de fato faz o scan das notícias ser muito rápido. E em cima disso, o Guga tocou em algo muito importante: **o valor dos comentários**. E de fato, eu e vocês devem fazer isso muitas vezes no YouTube, que é correr para os comentários para, até certo ponto, qualificar o conteúdo que a gente está prestes a consumir. Então na próxima tentativa de layout eu vou tentar fazer uma home mais HackerNews, e que já antecipe algums comentários, por exemplo, os mais votados.

![image](https://user-images.githubusercontent.com/4248081/118160451-2c70e680-b3d3-11eb-9f6e-96cd1b579811.png)

### 18/05/21 - Layout começando a ficar legal

Esses últimos dias foram ótimos para estressar várias ideias e segue abaixo o print de todas, sendo que a última versão é o que mais está nos agradando. Ela possui um elemento importante que não estava presente nos outros layouts: **o ranking das notícias**. Isso traz uma ordem/classificação melhor para o cérebro, ao invés das notícias rankeadas, porém o único índice é a quantidade de TabNews (e a posição da notícia vai variar conforme a data de publicação dela). Próximo passo é fazer o layout de dentro da notícia.

![image](https://user-images.githubusercontent.com/4248081/118731117-8ca9c300-b7ed-11eb-8724-dbe921e1c877.png)

![image](https://user-images.githubusercontent.com/4248081/118731136-96332b00-b7ed-11eb-8b94-4835b294b108.png)

![image](https://user-images.githubusercontent.com/4248081/118731162-a3e8b080-b7ed-11eb-83ba-dcf7229d0ffc.png)

![image](https://user-images.githubusercontent.com/4248081/118731182-b1059f80-b7ed-11eb-9cc0-46559ddf9871.png)

### 20/05/21 - Layout de dentro da notícia

Fazendo o layout de dentro da notícia, eu aproveitei para deixar o layout do TabCoins e XP mais discretos e próximos ao que aparece ao lado esquerdo de cada notícia e comentário. E um ponto importante desse layout é que o comentário possui o mesmo espaço e peso que o conteúdo da própria notícia. É importante ser assim, principalmente ter um espaço grande para a pessoa digitar o seu comentário (ter o mesmo espaço que a pessoa teve para criar a notícia principal), como em fóruns antigamente, para que a pessoa possa **trabalhar adequadamente** na criação do conteúdo. Note como o Facebook dá pouco espaço para colocar uma resposta, é um filete, é péssimo para criar conteúdos bem aprofundados e bem pensados. Próximo passo é começar a programar pra valer.

![image](https://user-images.githubusercontent.com/4248081/120021790-61b73000-bfa0-11eb-9fc1-8af0cfafed31.png)

## 28/05/21 - Convite feito aos Membros da Turma

Nessa sexta-feira, dentro do vídeo exclusivo `#54` para os Membros da Turma eu fiz o convite para, quem tiver interesse, deixar nos comentários o seu nome de usuário do Github que eu irei fazer o convite aqui para esse repositório (que neste momento está privado). A turma é sempre muito empolgada e eu sei que irão participar, mas eu não sei quantos e qual vai ser o resultado disso, vamos ver.

## 04/06/21 - WOW

**107 pessoas** pediram acesso ao repositório, enviei convite para todo mundo e **82 já aceitaram**. E nesse pequeno espaço de tempo, **muitas contribuições** já foram feitas, desde layouts no Figma, até implementações concretas no repositório e nas provas de conceito, como por exemplo Dark Mode. Fora isso, ótimas discussões já começaram a aparecer nas issues, o que é perfeito para pensar e ver as situações de outros ângulos.

![image](https://user-images.githubusercontent.com/4248081/123183286-1d576c80-d446-11eb-9fea-363d5b5825e3.png)

![image](https://user-images.githubusercontent.com/4248081/123183178-d6697700-d445-11eb-9f3f-c6cccb3b842a.png)

![image](https://user-images.githubusercontent.com/4248081/123183464-71fae780-d446-11eb-90cf-20592dad1212.png)

![image](https://user-images.githubusercontent.com/4248081/123183481-7d4e1300-d446-11eb-90df-d957e3cc16f2.png)

![image](https://user-images.githubusercontent.com/4248081/123183605-b7b7b000-d446-11eb-9393-01dd85748d00.png)

## 11/06/21 - Muitas novas contribuições

Repositório pegou fogo nos últimos dias, muita coisa legal aconteceu!!! Eu esperava que a Turma ia participar, mas não esperava tantas pessoas trazendo tanta energia boa. Eu vou colocar o print de algumas contribuições nesse meio tempo e o fantástico é que **tudo** está acontecendo por dentro desse repositório e ficando registrado para sempre. Quem sabe um dia esse repositório seja congelado no [GitHub Arctic Code Vault](https://www.youtube.com/watch?v=fzI9FNjXQ0o).

![image](https://user-images.githubusercontent.com/4248081/123184246-25181080-d448-11eb-8d88-3aceb040b3c1.png)

![image](https://user-images.githubusercontent.com/4248081/123184265-2fd2a580-d448-11eb-8b0e-aede0a727538.png)

![image](https://user-images.githubusercontent.com/4248081/123184461-96f05a00-d448-11eb-916d-ab931f35c5de.png)

![image](https://user-images.githubusercontent.com/4248081/123184502-ad96b100-d448-11eb-8d2d-7b2827058c6c.png)

![image](https://user-images.githubusercontent.com/4248081/123184988-c81d5a00-d449-11eb-8b6e-34767a93a514.png)

![image](https://user-images.githubusercontent.com/4248081/123185024-dbc8c080-d449-11eb-9ae6-803a00bb8332.png)

![image](https://user-images.githubusercontent.com/4248081/123185059-edaa6380-d449-11eb-9a5a-5569bbb62c0e.png)

## 15/06/21 - Milestones e Lives

Nem tudo num projeto é tecnologia, e uma coisa importante que eu gostaria que a turma vivenciasse com o desenvolvimento TabNews é o poder das **pequenas conquistas e comemorações** e como isso consegue construir projetos grandes ao longo do tempo. Com isso em mente e juntando com a sugestão de outros membros sobre Lives, eu organizei uma série de [Milestones](https://github.com/filipedeschamps/tabnews.com.br/milestones?direction=asc&sort=title) e para cada uma nós iremos fazer uma **Live de inauguração** para conversarmos sobre o que pode ser desenvolvido, e depois uma outra **Live de encerramento** para comemorarmos, onde nessa Live de encerramento nós iremos inclusive **fechar a última issue** que precisa ser fechada e **fazer o último deploy** que precisa ser feito. E [essa primeira Live de abertura](https://www.youtube.com/watch?v=vdXjOf6JA38) da [Milestone 0](https://github.com/filipedeschamps/tabnews.com.br/milestone/1) foi simplesmente **sensacional**, tanto por ter uma dinâmica diferente de qualquer outra live já feita no canal, quanto por termos conversado coisas muito importantes como **prazo** e se iríamos utilizar isso nas Milestones. Em resumo, iremos colocar prazo para fazer o cérebro conseguir _"ver marcadores"_ num campo infinito que é o tempo, e usar esses marcadores como **referência** para sentir o tempo passar. Do contrário, sem esses marcadores, o cérebro perde sua referência e a única que fica é a **quantidade** de trabalho a ser feito (por exemplo: issues abertas/fechadas), o que também é uma outra marcação interessante, mas que sozinha pode estagnar. Então nós definimos como objetivo tentar concluir a [Milestone 0](https://github.com/filipedeschamps/tabnews.com.br/milestone/1) até o dia 25 de Junho que é uma **sexta-feira**, ou seja, iremos fazer o deploy final da Milestone naquele dia da semana proibído 😂 Mas isso que é massa de um projeto nesse estágio, dá para mexer nas coisas sem medo e eu tenho certeza que, para quem é iniciante, vai fazer muita diferença ver essas coisas acontecendo na frente delas. Inclusive a gente deletou o domínio do tabnews.com.br e derrubou o site para testar uma configuração de redirecionamento da Vercel, foi **muito** legal ter todo mundo junto pra acompanhar o negócio quebrando e depois sendo consertado.

![image](https://user-images.githubusercontent.com/4248081/123185814-9c9b6f00-d44b-11eb-9774-1b4f326b3b20.png)

![image](https://user-images.githubusercontent.com/4248081/123187260-a672a180-d44e-11eb-96d8-578fce29967e.png)

## 24/06/21 - Cross collaboration

Hoje já estamos com **224 pessoas** dentro do repositório e **muitas contribuições** aconteceram nesse meio tempo. Depois da Live de inauguração da Milestone 0, a turma atacou as issues, como por exemplo [essa em que bolamos várias idéias para a página "Em Construção"](https://github.com/filipedeschamps/tabnews.com.br/issues/23), e idéias extras sobre [fakenews](https://github.com/filipedeschamps/tabnews.com.br/issues/27), [internacionalização](https://github.com/filipedeschamps/tabnews.com.br/issues/35) e [acessibilidade](https://github.com/filipedeschamps/tabnews.com.br/issues/43). Só que algo **especial** aconteceu [nesse Pull Request](https://github.com/filipedeschamps/tabnews.com.br/pull/45) onde implemento uma sugestão para a página de "Em construção", olha que interessante: eu fiz uma implementação, o Membro [@rhandrade](https://github.com/rhandrade) encontrou e isolou um bug, e outro Membro [@rodrigoKulb](https://github.com/rodrigoKulb) implementou um fix... e foi tudo **muito rápido**. E eu pessoalmente achei especial porque se eu tivesse sozinho nesse repositório, nada disso teria acontecido. Eu sinceramente espero que esse repositório do TabNews abra mais oportunidades assim para trabalharmos juntos, cada um conseguindo observar e participar em algum ponto do serviço. Se conseguirmos manter essas coisas acontecendo, no longo prazo iremos construir algo **realmente especial**. Bom, a Live de encerramento e comemoração da Milestone 0 supostamente irá acontecer amanhã, vamos ver como vai ser... eu to empolgado e queria que fosse hoje já!!!

## 25/06/21 - Milestone 0 (ENCERRAMENTO)

Acabou de acontecer o encerramento da Milestone 0 dentro de [uma das melhores Lives](https://www.youtube.com/watch?v=ziFonOfCJOg) que eu senti que fiz no canal... muito melhor que a inauguração da Milestone, pois deu para trazer e conversar com os Membros vários pontos importantes que vou destacar abaixo:

1. **[Relação entre Simplicidade e Refino (43:13)](https://youtu.be/ziFonOfCJOg?t=2593)** - Em resumo, quanto mais simples mantivermos as coisas, mais refinadas elas eventualmente irão ficar. A barreira de contribuição é mais baixa e pessoas em diferentes níveis, e que vão perceber diferentes detalhes, poderão contribuir. Isso é importante, pois **ideia boa** pode ser bolada e executada por qualquer pessoa. E no fim, um software _bloated_ com infinitas funcionalidades é péssimo de se usar e nenhuma das features consegue ser refinada, pois toda hora você está lutando com a entropia que está saindo fora do controle na base. E não tem coisa melhor do que usar um software que vai direto ao ponto e resolve **muito bem** o seu problema. Eventualmente são esses softwares que ganham destaque e conseguem penetrar um ecossistema muitas vezes dominado por um software _bloated_. Mas para isso, você prcisa de **refino** e você só atinge isso depois de _lamber_ muito as poucas features existentes, e que nos leva para o próximo tópico, de ser **o melhor em algo específico**.
2. **[O TabNews deveria ser melhor no que? (47:12)](https://youtu.be/ziFonOfCJOg?t=2832)** - A gente em grupo deve querer o que, acima de qualquer outra coisa? Minha sugestão na live foi: **_"Um ecossistema que para em pé, formado por pessoas que criam conteúdos de valor concreto"_**. Eu sinceramente gostaria visitar várias vezes por dia um local em que eu sei que minhas contribuições vão me dar retorno e que eu vou encontrar outros conteúdos de valor concreto. Tudo no projeto, comparado ao que você acabou de ler, vira algo _satélite_ (secundário) e que deveria contribuir e servir de suporte para que isso aconteça. O **destaque** do projeto não vai ser na tecnologia usada, vai ser no que escolhemos para sermos os melhores em primeiro lugar, e em segundo como isso foi executado (tecnologia).
3. **[Gostaria de ser o Guia, e não o Mentor (52:15)](https://youtu.be/ziFonOfCJOg?t=3135)** - Peço a permissão para, ao invés de no projeto eu ser um **Mentor**, eu ser um **Guia**. A diferença é que um Mentor fica afastado e você vai até a ele para se consultar. Já um Guia está junto com você, **junto na trilha**, enfrentando e vivenciando o que der e vier ao longo da trajetória. Se aparecer um **Leão** na trilha, eu quero estar lá junto, e sinceramente, eu **quero** que apareça um Leão (por exemplo o site cair), pois isso vai ser uma **ótima** oportunidade para nos juntarmos numa Live, investigar o que aconteceu e trocar muita experiência e conhecimento. E a permissão que eu peço é de ser o Guia mais chato que vai existir, para manter a gente na trilha da **simplicidade** para conseguirmos causar um **contraste** na área que estamos entrando (portal de notícias e conteúdos).
4. **[Relação entre Desenvolver Pouco e Aprender Muito (59:32)](https://youtu.be/ziFonOfCJOg?t=3572)** - Conectado com o item anterior, de fazer coisas simples, eu proponho a gente sair um pouco da **velocidade de desenvolvimento** que é esperada quando você está trabalhando em um ambiente corporativo. Para esse projeto, para quem está vivenciado isso em tempo-real, eu sugiro a gente **desenvolver pouco**, e como consequência **aprender muito**. Eu até bolei uma pequena frase para representar isso, [mas ela foi tão ridícula que eu não conseguia falar na Live](https://youtu.be/ziFonOfCJOg?t=3618), só que em resumo é ao invés de desenvolvermos em **2x** e atropelarmos tudo que nem um bando de maluco, a gente desenvolver em **0.5x** e nos dar o direito de aprender muito durante esse tempo. Isso vai gerar frutos imensuráveis para o **futuro** do projeto. E é esperado que, abrir margem para isso, também abre margem para **muito ruído**, só que eu vou usar meu papel do Guia mais chato do mundo para afunilar todo mundo na trilha mais simples, na esperança de que ela agrade a maioria das pessoas e contemple a maioria das sugestões, de uma forma ou outra, pelo menos no **engatinhar** de uma features até os seus **primeiros passos**. Falando em engatinhar, [o Oliver apareceu nesse momento na Live](https://youtu.be/ziFonOfCJOg?t=3830).
5. **[O Deploy mais importante de todos (1:59:12)](https://youtu.be/ziFonOfCJOg?t=7152)** - Esse é o momento em que eu peço a permissão para fazer o merge do [Pull Request](https://github.com/filipedeschamps/tabnews.com.br/pull/56) que coloca no ar a primeira página oficial do TabNews, a página que eu acredito ser a mais especial de todas, para o resto da vida do projeto. Obrigado a todo mundo que estava na Live para companhar esse momento, e eu sinceramente espero que a gente crie mais momentos assim.

![image](https://user-images.githubusercontent.com/4248081/123688637-1d20ed80-d807-11eb-8ab3-b0e6ec930ae3.png)

![image](https://user-images.githubusercontent.com/4248081/123689581-38402d00-d808-11eb-8def-71601dacc6b7.png)

## 30/07/21 - Milestone 1 (ENCERRAMENTO)

Mais uma [Live de encerramento](https://youtu.be/rVsYU9HyREM) simplesmente **SENSACIONAL** com direito a revisitar vários tópicos **fundamentais** do projeto e até fazer deploy de um Banco de Dados em Produção (numa sexta-feira). Outro detalhe legal foi toda ajuda que a turma foi dando pelo chat durante a Live de algumas dúvidas que foram surgindo. Eu realmente sou apaixonado por eles e não troco por ninguém!!! Bom, vamos ao resumo dos principais tópicos:

1. **[Por que estou feliz? (10:00)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=599)** - Começo a Live de fato falando algums motivos que me fazem estar muito feliz, onde em resumo: **1)** O projeto do TabNews está me dando oportunidade de aprender muita coisa, mas com um detalhe especial que é **registrar tudo em tempo-real**, desde a primeira issue criada no repositório até essas Lives e as entradas no Diário aqui do README. E isso vai se manter para todos os próximos tópicos, como Autenticação/Autorização e vai se tornar um excelente material de referência para qualquer outro projeto futuro. **2)** Falando em projetos futuros, a fundação que está sendo criada no repositório do TabNews pode servir para vários tipos de projetos que qualquer pessoa queira fazer e aproveitar ou código ou os conhecimentos. **3)** Por último, estou feliz porque na Milestone a seguir, a [Milestone 2](https://github.com/filipedeschamps/tabnews.com.br/milestone/3) já teremos conteúdo pra valer na Home do site.
2. **[Como instalar e rodar o projeto (14:00)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=840)** - Bastante simples esse item, pois basta você ter na sua máquina Node.js e Docker (com Docker Compose), clonar o repositório, instalar as dependências e rodar `npm run dev` que todo o ambiente vai subir para você continuar o desenvolvimento.
3. [Testes automatizados e CI (33:43)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=2023) - Novamente bastante simples, uma vez que você pode rodar os testes pelo comando `npm test` ou `npm run test:watch` caso queira rodá-los de forma interativa. Mas o legal é que isso foi implementado **duas vezes**, uma [por esse PR](https://github.com/filipedeschamps/tabnews.com.br/pull/76) onde a estratégia era subir todos os serviços dependentes por dentro do script de teste, e [por esse outro PR](https://github.com/filipedeschamps/tabnews.com.br/pull/82) onde subir esses serviços foi removido do código e delegado para camada de infraestrutura que abraça os testes (e ficou **muito** melhor e mais resistente). Vale muito a pena entrar no primeiro PR para acompanhar a discussão, e no segundo PR para acompanhar a resolução. Outro detalhe nesta parte foi a descoberta do [act](https://github.com/nektos/act) que simula o ambiente do Github Actions, o que é ótimo para não precisar ficar marretando o seu repositório com pushes ou pull requests para implementar as Actions.
4. [Padrão de Linting de Code Style e Commits (1:06:32)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=3992) - Isso não é obrigatório, mas bastante necessário caso você não queira perder o controle e padronização do seu projeto. Na parte Code Style que você pode verificar [nesse PR](https://github.com/filipedeschamps/tabnews.com.br/pull/79) é feito o linting pelo `eslint` integrado diretamente ao `next` a partir da versão `11` e também pelo `prettier`. Já para parte de commits, [esse PR](https://github.com/filipedeschamps/tabnews.com.br/pull/80) implementa o uso de [Conventional Commits](https://www.conventionalcommits.org/), além de adicionar uma ferramenta chamada `cz` que pode ser acionada pelo comando `npm run commit` e que auxilia as pessoas a criarem as mensagens no formato certo. E ter um padrão de commits é ótimo para fazermos changelogs automatizados. Fora isso, vale a pena destacar [a issue](https://github.com/filipedeschamps/tabnews.com.br/issues/42) que discute várias sugestões sobre esse assunto e também a padronização de outras coisas dentro do Github e que não foram implementadas nessa Milestone.
5. [Arquitetura e Pastas (1:18:36)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=4716) - Como o projeto está num estágio pequeno, não deu para desenvolver muito o assunto na Live, porém [essa issue](https://github.com/filipedeschamps/tabnews.com.br/issues/12) tem uma discussão **sensacional** sobre o assunto, inclusive numa ideia que o Next.js nos travou.
6. [Mudança de Licença (1:19:12)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=5352) - Não vai ter issue melhor que [essa aqui](https://github.com/filipedeschamps/tabnews.com.br/issues/64) para explicar o que aconteceu, pois a conversa lá foi de **altíssimo** nível. Mas em resumo, saímos da licença `MIT` para a `GPLv3`.
7. [(1:31:25)](https://youtu.be/rVsYU9HyREM?list=PLMdYygf53DP7VRIRKmkSdGuDf-6OXcj4H&t=5481) - E esse foi o momento mais massa da Live, onde a gente deleta o banco de Produção, cria de novo e configura as variáveis de ambiente. Com isso, foi possível rodar as migrations pela primeira vez em ambiente de Produção e quem conseguiu fazer isso (dado que apenas **uma única pessoa** iria conseguir rodar), foi o [huogerac](https://github.com/huogerac), e ele tirou um print do retorno `201` e eu coloquei esse print logo alí em baixo, inclusive logo depois a minha reação de nem ter conseguido listar as migrations pendentes. Vale a pena destacar também [a issue](https://github.com/filipedeschamps/tabnews.com.br/issues/84) que mostra e resolve alguns problemas de conexão, e também [a issue](https://github.com/filipedeschamps/tabnews.com.br/issues/61) que definiu a DigitalOcean como a provedora do banco e os motivos de usar Postgres sem ORM.

![image](https://user-images.githubusercontent.com/4248081/127724683-a789527c-2d33-4c0c-9167-94ab6ab647c0.png)
![image](https://user-images.githubusercontent.com/4248081/127724792-b5a379f7-af50-4160-92cc-4e6365ffc268.png)
