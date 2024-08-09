# [tabnews.com.br](https://www.tabnews.com.br/)

O [TabNews](https://www.tabnews.com.br/) é um site focado na comunidade da área de tecnologia, destinado a debates e troca de conhecimentos por meio de publicações e comentários criados pelos próprios usuários.

Esse repositório contém o código-fonte do site e da API do TabNews.

O TabNews disponibiliza APIs públicas que você pode utilizar para construir outros projetos relacionados, desde que respeite os [Termos de Uso](https://www.tabnews.com.br/termos-de-uso).

**Conteúdo**

- [Instalar e rodar o projeto](#instalar-e-rodar-o-projeto)
  - [Dependências globais](#dependências-globais)
  - [Dependências locais](#dependências-locais)
  - [Rodar o projeto](#rodar-o-projeto)
  - [Cadastro e Login de usuários](#cadastro-e-login-de-usuários)
    - [Criar um usuário manualmente](#criar-um-usuário-manualmente)
    - [Utilizar usuários pré-cadastrados](#utilizar-usuários-pré-cadastrados)
- [Rodar os testes](#rodar-os-testes)
- [Formas de contribuir](#formas-de-contribuir)
- [Histórico do desenvolvimento](#histórico-de-desenvolvimento)
  - [Início do projeto](#início-do-projeto)
  - [Milestones](#milestones)
- [Contribuidores](#contribuidores)

## Instalar e rodar o projeto

Rodar o TabNews em sua máquina local é uma tarefa extremamente simples.

### Dependências globais

Você precisa ter duas principais dependências instaladas:

- Node.js LTS v20 (ou qualquer versão superior)
- Docker Engine v17.12.0 com Docker Compose v1.29.2 (ou qualquer versão superior)

### Dependências locais

Com o repositório clonado e as dependências globais instaladas, você pode instalar as dependências locais do projeto:

```bash
npm install
```

### Rodar o projeto

Para rodar o projeto localmente, basta executar o comando abaixo:

```bash
npm run dev
```

Isto irá automaticamente rodar serviços como Banco de dados (incluindo as Migrations), Servidor de Email e irá expor um Serviço Web (Frontend e API) no seguinte endereço:

```bash
http://localhost:3000/
http://localhost:3000/api/v1/status
```

Observações:

- Para derrubar todos os serviços, basta utilizar as teclas `CTRL+C`, que é o padrão dos terminais para matar processos.
- Você pode conferir o endereço dos outros serviços dentro do arquivo `.env` encontrado na raiz do projeto, como por exemplo o endereço e credenciais do Banco de Dados local ou o Frontend do Serviço de Email.

### Cadastro e Login de usuários

No ambiente de desenvolvimento você poderá tanto criar usuários manualmente (inclusive para receber e testar o email de ativação), quanto utilizar usuários pré-cadastrados e que já foram ativados para sua conveniência.

#### Criar um usuário manualmente

1. Após subir os serviços, acesse http://localhost:3000/cadastro
2. Preencha os dados e utilize **qualquer email** com formato válido, mesmo que este email não exista, por exemplo: `teste@teste.com`
3. O backend irá enviar um email para o servidor **local** de emails e que pode ser acessado pelo endereço http://localhost:1080/
4. Abra o email de Ativação e acesse o link para ativar sua conta de fato.
5. Com a conta ativa, realize o login: http://localhost:3000/login

#### Utilizar usuários pré-cadastrados

Por padrão, ao rodar o comando `npm run dev` será injetado dois usuários ativados, um com features padrões e outro com features administrativas, como a habilidade de rodar as Migrations usando a API ou alterar o conteúdo de outros usuários. Segue abaixo as credenciais destes dois usuários (`"email"` + `"senha"`):

- **Usuário Admin**: `"admin@admin.com"` + `"password"`
- **Usuário padrão**: `"user@user.com"` + `"password"`

## Rodar os testes

Há várias formas de rodar os testes dependendo do que você deseja fazer, mas o primeiro passo antes de fazer qualquer alteração no projeto é rodar os testes de forma geral para se certificar que tudo está passando como esperado. O comando abaixo irá rodar todos os serviços necessários, rodar os testes e em seguida derrubar todos os serviços.

```bash
npm test
```

Caso queira manter os serviços e testes rodando enquanto desenvolve (e rodando novamente a cada alteração salva), use o modo `watch` com o comando abaixo:

```bash
npm run test:watch:services
```

Os logs do Serviço Web e Vitest (dos testes) irão se misturar, então caso queira rodar eles de forma separada, abra dois terminais separados e rode o seguinte:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:watch
```

Caso não queira executar (ou dar `watch`) em todos os testes e queira isolar arquivos específicos de teste, você pode filtrar pelo caminho. Não é necessário digitar o caminho inteiro para o arquivo e você também pode fornecer mais de um caminho, veja alguns exemplos abaixo:

```bash
# Rodar todos os testes de "users" e "status" da api "v1"
npm run test -- v1/users/ v1/status/

# Rodar apenas o arquivo tests/integration/api/v1/_use-cases/registration-flow.test.js
npm run test -- registration-flow

# Rodar apenas o arquivo tests/integration/api/v1/contents/[username]/patch.test.js
npm run test:watch:services -- username]/patch

# Rodar apenas o arquivo tests/integration/api/v1/contents/[username]/[slug]/get.test.js
npm run test:watch -- contents/[username]/[slug]/get
```

Observações:

- A forma como é tratado o caminho dos arquivos pode mudar dependendo do seu sistema operacional.
- A forma como o seu terminal interpreta caracteres especiais como `/` ou `[` pode mudar.

## Formas de contribuir

Você pode contribuir com o projeto de várias formas diferentes:

- **Criar conteúdos no site:** você pode criar publicações ou comentários no [TabNews](https://www.tabnews.com.br/) com conteúdo de valor para outros leitores. Para entender mais sobre isso, leia [sobre a plataforma](https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa) e veja as [perguntas mais frequentes](https://www.tabnews.com.br/faq).
- **[Reportar privadamente problemas de segurança](/CONTRIBUTING.md#reportar-privadamente-problemas-de-segurança):** problemas que envolvem falhas de segurança devem ser reportados de forma privada para possibilitar a discussão das vulnerabilidades diretamente com os mantenedores do repositório.
- **[Participar de debates em issues do repositório](/CONTRIBUTING.md#participar-de-debates-em-issues-do-repositório):** mesmo sem implementar algo no código, você pode contribuir com detalhes para a resolução de algum problema ou com ideias de implementação de algum recurso.
- **[Enviar PRs com soluções previamente debatidas](/CONTRIBUTING.md#enviar-prs-com-soluções-previamente-debatidas):** se você encontrou um issue que foi debatido e deseja implementá-lo, pode abrir um PR com a solução para ser avaliada e incorporada no TabNews.

## Histórico de Desenvolvimento

### Início do projeto

No início do projeto foram feitas 40 publicações no [Wiki](https://github.com/filipedeschamps/tabnews.com.br/wiki) do repositório. Lá você encontrará informações desde como a ideia do TabNews surgiu e como foram as contribuições no início do projeto, até as definições do layout e outras tomadas de decisão.

### Milestones

Milestones são marcos históricos do projeto para ajudar a guiar o desenvolvimento numa direção específica. Pelo GitHub é possível ver [a Milestone em andamento](https://github.com/filipedeschamps/tabnews.com.br/milestones?state=open) e [as Milestones encerradas](https://github.com/filipedeschamps/tabnews.com.br/milestones?state=closed).

## Contribuidores

<a href="https://github.com/filipedeschamps/tabnews.com.br/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=filipedeschamps/tabnews.com.br&max=500" alt="Lista de contribuidores" width="100%"/>
</a>
