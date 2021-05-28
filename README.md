# tabnews.com.br

## Diário

### Antes de 17/10/20 - Um grande problema

Tenho uma [Newsletter](https://filipedeschamps.com.br/newsletter) gratuita que faço com meu irmão [Gustavo Deschamps](https://github.com/gustavodeschamps), onde apesar de ter uma aceitação [muito acima do que a gente esperava](https://youtu.be/Jau0Rn_ADxo), ao mesmo tempo é um material que dá **muito trabalho** para ser produzido e ficamos **extremamente frustrados** quando, por exemplo, um mesmo provedor de email decide entregar esse material para alguns usuários, mas não para outros, e sem padrão algum. E por conta disso, decidimos criar o **TabNews** para resolver esse problema, mas **spoiler alert**, não resolve, continue lendo para entender.

### 17/10/20 - Registro do domínio

Como todo bom nerd, sem nem mesmo a ideia ter sido completamente formada, a gente foi lá e comprou o domínio [tabnews.com.br](https://tabnews.com.br). Numa breve conversa, chegamos numa ideia de um site site que fique atualizado e trazendo **notícias** (news) em tempo-real para que a pessoa deixe o ele aberto numa **aba** (tab) no navegador, e com isso o Gustavo sugeriu o nome **TabNews**. O engraçado é que toda hora a gente tentava fugir desse nome, mas a gente não conseguia, é muito simples de entender, decorar e escrever.

### 25/12/20 - Criação do repositório

Esse repositório aqui foi criado no meio do Natal. Eu sei, é estranho, mas inspiração não tem data marcada... quando ela vem, eu preciso obedecer.

### 30/12/20 - Primeira issue e a descoberta de algo importante

Ao escrever a [issue de inception](https://github.com/filipedeschamps/tabnews.com.br/issues/1) do projeto, notamos algo **muito importante**: o TabNews não irá consertar o problema de entregabilidade dos emails (o fato dele existir não fará os emails serem entregues como deveriam, correto?), mas ao mesmo tempo será de grande valor para dois públicos, **principalmente para o segundo**:

1. Para quem trabalha com tecnologia e precisa consumir conteúdos com valor concreto.
2. Para quem trabalha com a criação de conteúdos sobre tecnologia **(ao implementarmos um modelo de Revenue Share para esses criadores)**.

### 14/01/21 - Revenue Share

Essa é a parte **mais empolgante do projeto**, até porque tanto eu quanto o Gustavo **não queremos ficar acima do sistema** e vamos participar do exato mesmo Revenue Share que todo mundo está participando, até para entender na pele o que está funcionando e o que deveria ser melhorado. Claro que em algum momento iremos implementar uma divisão de custos de servidor e manutenção do projeto, mas isso precisa ficar no futuro e somente após o modelo de Revenue Share **estar funcionando** para quem está criando conteúdo de fato (e por conteúdo entenda **notícias** ou **comentários** que adicionam valor para quem está lendo). E o jeito que isso vai ser feito é bastante interessante, mas vamos deixar para desenvolver mais para frente.

### 15/01/21 - Cultura

Nós queremos dar um 180 graus e ir na **contramão** do que está acontecendo atualmente nas redes sociais e voltar com o espírito dos **fóruns** de antigamente, onde era possível ter conversas bem elaboradas, profundas e uma thread (tópico) composta por várias respostas que muitas vezes valia mais do que qualquer artigo no assunto. Então nós vamos estabelecer, custe o que custar, que a cultura do TabNews seja de pessoas **brutalmente exatas e empáticas, simultaneamente**. Sugiro você parar para pensar por alguns minutos como estes dois pontos, quando levados ao máximo simultaneamente conseguem criar interações **extremamente valiosas** para quem está participando de uma discussão. Então colado a isso, é aqui que entra uma mecânica importante: **nós vamos desestimular comentários simples**, como por exemplo um agradecimento _"ah valeu! falou"_ em favor de comentários que devolvam algum valor concreto, e caso isso não seja possível, devolva **valor** ao autor do comentário ou post através das **TabCoins**.

### 17/01/21 - TabCoins

Diferente de sites como o Reddit onde você pode **comprar** moedas virtuais utilizando dinheiro real, o TabNews **nunca irá abrir margem para compra de TabCoins** e a **única forma** de adquirir elas é gerando **valor concreto** através da publicação de notícias, artigos, tutoriais ou comentários. O recebimento das moedas irá acontecer tanto no ato da criação desses materiais, quanto na troca/agradecimento de pessoas que possuem moedas e querem sinalizar que o seu post/comentário possui valor. Então ao invés de uma mecânica de **like** em que numa rede social convencional você pode infinitamente colocar 1 em cada post que quiser (pois o seu saldo de like não vai acabar), no TabNews a sinalização de valor não é banalizada, e sempre herda de algum valor prévio **concreto**. Inicialmente eu pensei que as pessoas poderiam utilizar as mesmas TabCoins para participar do Revenue Share, mas isso não seria o incentivo correto, pois isso estimularia elas a **guardarem** as moedas para maximizar o Revenue Share, ao invés de **investir** elas em posts ou comentários com valor concreto e contribuir com outros criadores. Então para esse ecossistema parar em pé, precisamos de um **vetor contrário**, um vetor que gere a mecânica dos pistões de um motor (quando um desce, o outro sobe) e aí o negócio vai pra frente.

### 01/02/21 - XP

Como incentivo para a pessoa investir as suas moedas em conteúdos com valor concreto, cada vez que ela faz isso, os seus Experience Points (XP) irão aumentar e liberar **novos recursos** no site e **aumentar a sua participação** no Revenue Share. Por exemplo, inicialmente a pessoa terá apenas permissão para postar comentários, e não poderá criar conteúdos como notícias ou artigos no feed principal. Ao participar do **fluxo completo de contribuição** (ao contribuir com comentários de valor, receber e gastar moedas), seu XP irá aumentar ao ponto de atingir a faixa de alguém que pode criar postagens no feed principal. E isso vai valer para qualquer outra feature que algum usuário possa ter. E esse caminho é importante, porque como destacado no item anterior, moedas não podem ser compradas, como consequência XP não pode ser comprado e como consequência o único caminho para evoluir dentro do site e ganhar espaço no Revenue Share é através de contribuições de valor concreto. E algo extremamente importante de deixar explícito, é que com isso empresas **não vão poder comprar anúncios dentro do site**. Se elas quiserem ter um espaço, vão precisar participar do fluxo completo de contribuição. Isso não qur dizer que nuna haverá espaço para um patrocícino, mas com certeza ele **não será convencional** e queremos ao máximo que o espaço publicitário do site seja dos próprios usuários que criam conteúdo.

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

Tive um insight hoje: para aumentar as chances do TabNews dar certo, ele precisa ter o potencial de conseguir **matar a Newsletter**. Não que isso vai acontecer, mas é melhor você se **"autocanibalizar"** do que outra pessoa consiga e a direção que o layout estava tomando era de um site convencional. Isso me deixou pensando bastante, porque isso não "mexe o ponteiro" das pessoas. A Newsletter mexeu o ponteiro porque ela teve uma abordagem **corajosa**... ela tem uma postura que, ou vai deixar as pessoas satisfeitas ou insatisfeitas, mexendo para algum lado o ponteiro. Isso é importante em qualquer projeto. Então depois de pensar bastante, eu decidi tentar uma outra abordagem: ao invés de fazer o clássico item com título e conteúdo, usar o mesmo princípio das notícias sintetizadas e montar um site em cima disso. E sabe o que isso lembra? O Twitter... então a próxima abordagem vai ser tentar fazer um layout mais próximo do Twitter e tentar fazer o site ser um "Twitter de nicho" onde as notícias vão entrando de forma sintetizada, mas que possam ser expandidas nos comentários. E as mecânicas anteriores de TabCoins e XP continuam a mesma. Vamos ver se o negócio para em pé.


### 11/05/21 - Está difícil de se autocanibalizar

Por algum motivo, não estou conseguindo fazer a versão "site" dos conteúdos que são enviados na Newsletter ser tão gostoso de ler quanto nos emails. Será que o mindset de uma pessoa **lendo** um email, é diferente de uma pessoa **vendo** um site? Essas palavras são importantes, uma pessoa talves não vê um email, ela **lê** um email, e um site (a home pelo menos) a pessoa quer **ver**, e ver as informações de forma rápida para daí escolher o que ler. Bom, segue abaixo duas tentativas, e vou agora tentar algo próximo ao Hackernews.

![image](https://user-images.githubusercontent.com/4248081/117865372-c194a380-b24a-11eb-9e7f-b0b4faec468a.png)

![image](https://user-images.githubusercontent.com/4248081/117865400-c9ecde80-b24a-11eb-8f70-8352f16a778d.png)

### 13/05/21 - Guga e Renata tiveram excelentes ideias

Nos últimos dias eu estava desenhando o layout abaixo, tentando encaixar na home tanto a lista de notícias quanto já aberta a notícia principal e apesar de que é uma ideia interessante de ser explorada, na avaliação do Guga o primeiro impacto ficou muito confuso, muita informação, e eu pessoalmente também não gosto de ler coisas na direita. De qualquer forma, ao mostrar o HackerNews para a Renata, ela falou que de fato uma coisa legal é ler de forma **linear** as notícias, e não há quebra de linha, o que de fato faz o scan das notícias ser muito rápido. E em cima disso, o Guga tocou em algo muito importante: **o valor dos comentários**. E de fato, eu e vocês devem fazem isso muitas vezes no YouTube, que é correr para os comentários para, até certo ponto, qualificar o conteúdo que a gente está prestes a consumir. Então na próxima tentativa de layout eu vou tentar fazer uma home mais HackerNews, e que já antecipe algums comentários, por exemplo, os mais votados.

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
