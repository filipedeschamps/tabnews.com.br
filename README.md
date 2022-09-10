# tabnews.com.br

<details><summary><h2>Documentação da API</h2></summary>


### Visão Geral:
- [Change log](#changelog)
- [Introdução](#introducao)
- [Base URL](#baseurl)
- [Obter conteúdos](#a)
    - [Lista de conteúdos da página inicial](#b)
    - [Lista de conteúdos de um determinado usuário](#c)
    - [Obter conteúdo e dados de uma publicação](#d)
    - [Obter dados de uma publicação](#e)
    - [Obter thumbnail de uma publicação](#f)
- [Status](#g)
- [Autenticação](#h)
    - [Criar usuário](#i)
    - [Logar usuário](#j)
    - [Recuperar senha](#k)
- [Editar perfil](#l)
- [Publicar conteúdos](#m)

<br id="changelog">

### Change log
- (10/09/2022) - Formatação alterada e atualizadas as funções da API.
<br>
<br id="introducao">

### Introdução
Todo TabNews foi construído através de **APIs públicas** e você pode consumir elas da forma que desejar (respeitando as políticas de uso).

A comunicação é feita através de HTTPS usando GET ou POST. Tanto a solicitação quanto a resposta são formatadas como JSON e o tipo de conteúdo de ambas é application/json.

⚠ Para requisições do tipo POST, parâmetros não inclusos na **URL devem ser inseridos como um Content-Type de `application/json`.**
<br id="baseurl">

### Base URL
Todas as URLs incluídas nessa documentação exigem a `baseUrl`:

```
https://www.tabnews.com.br/api/v1
```
<br>
<br id="a">

### Obter conteúdos
#### Lista de conteúdos da página inicial
<div id="b"></div>

```
GET {{BaseUrl}}/contents?page={pagina}&per_page={porPagina}&strategy={estrategia}
```

| Parâmetro | Descrição |
| --- | --- |
| {pagina} | O número da página que você deseja acessar. |
| {porPagina} | O número de conteúdos que devem ser retornados por página. |
| {estrategia} | Ordem de classificação dos conteúdos, pode ser definida em **new**, **old** e **relevant**. |
<br>

#### Lista de conteúdos de um determinado usuário
<div id="c"></div>

```
GET {{BaseUrl}}/{user}?page={pagina}&per_page={porPagina}&strategy={estrategia}
```

| Parâmetro | Descrição |
| --- | --- |
| {username} | O username do usuário que você quer acessar os conteúdos. |
| {pagina} | O número da página que você deseja acessar. |
| {porPagina} | O número de conteúdos que devem ser retornados por página. |
| {estrategia} | Ordem de classificação dos conteúdos, pode ser definida em **new**, **old** e **relevant**. |
<br>

#### Obter conteúdo e dados de uma publicação
<div id="d"></div>

```
GET {{BaseUrl}}/contents/{user}/{slug}
```

| Parâmetro | Descrição |
| --- | --- |
| {user} | Usuário que você deseja obter o post. |
| {slug} | Slug do post que você deseja obter. |
<br>

#### Obter comentários de uma publicação
<div id="e"></div>

```
GET {{BaseUrl}}/contents/{user}/{slug}/children
```

| Parâmetros |     |
| --- | --- |
| {user} | Usuário dono do postque você deseja obter os comentários. |
| {slug} | Slug do post que você deseja obter os comentários. |
<br>

#### Obter thumbnail de uma publicação
<div id="f"></div>

```
GET {{BaseUrl}}/contents/{user}/{slug}/thumbnail
```

| Parâmetros |     |
| --- | --- |
| {user} | Usuário dono do post que você deseja obter a thumbnail. |
| {slug} | Slug do post que você deseja obter a thumbnail. |
<br>
<br id="g">

### Status
Para obter quantos usuários foram criados (por dia):

```
GET {{BaseUrl}}/analytics/users-created
```

Para obter quantas publicações foram feitas (por dia):

```
GET {{BaseUrl}}/analytics/root-content-published
```

Para obter quantos usuários foram criados (por dia):

```
GET {{BaseUrl}}/analytics/child-content-published
```
<br>
<br id="h">

### Autenticação
<div id="i"></div>

#### Criar usuário

```
POST {{BaseUrl}}/users
```

**Corpo da requisição:**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| username | string | O username do usuário que você quer criar. |
| email | string | Um email válido que será usado para o login e outras opções. |
| password | string | A senha do usuário que você quer criar. |

⚠ Para confirmar a conta, o usuário deve acessar o link de verificação que foi enviado para o email. ⚠
<br id="j">

#### Logar usuário
Depois que o email for verificado, a requisição deve ser feita para este endpoint:

```
POST {{BaseUrl}}/sessions
```

**Corpo da requisição:**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| email | string | O email no qual o usuário foi criado. |
| password | string | A senha que foi definida na criação do usuário. |

<details><summary>Exemplo de resposta</summary>
    
```json
{
  "id": "6fbeca8f-13f1-43e3-b3**-************",
  "token": "e5fba39f8c4ec21cfd50d94ec8f659ed3258e301afe51240786d9ecddc8d35aeecae391ffe73e38d8c**************",
  "expires_at": "yyyy-mm-ddT14:34:08.664Z",
  "created_at": "yyyy-mm-ddT14:34:08.664Z",
  "updated_at": "yyyy-mm-ddT14:34:08.664Z"
}
```
</details>

<details><summary>Exemplo de resposta com erro</summary>
    
```json
{
  "name": "UnauthorizedError",
  "message": "Dados não conferem.",
  "action": "Verifique se os dados enviados estão corretos.",
  "status_code": 401,
  "error_id": "4a61276a-8dfc-41cc-a563-7fa4975*****",
  "request_id": "fe12a267-aa3c-4fad-8375-2fe92d6*****",
  "error_location_code": "CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH"
}
```
</details>
<br id="k">

#### Recuperar senha

```
POST {{BaseUrl}}/recovery
```

**Corpo da requisição:**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| username | string | O username do usuário que você deseja recuperar a senha. |
| email | string | O email do usuário que você deseja recuperar a senha. |

⚠ Apenas 1 dos valores devem ser passados na requisição. O usuário receberá uma link no email para a recuperação da senha.
<br>
<br id="l">

### Editar perfil

Para alteração de qualquer informação, a requisição deve ser feita para o seguinte endpoint, onde `{username}` é o username atual do usuário que você deseja alterar as informações:

```
POST {{BaseUrl}}/users/{username}
```

**Corpo da requisição:**

Todos os parâmetros são opcionais, ou seja, você só precisa enviar o parâmetro da informação que você deseja mudar.

| Parâmetros | Tipo | Descrição |
| --- | --- | --- |
| username | string | Para alterar o nome de usuário. |
| email | string | Para alterar o email do usuário (ele precisará ser verifificar da mesma forma que foi verificado na criação do usuário). |
| password | string | Para alterar a senha do usuário. |
| notifications | boolean | Para alterar se o usuário deseja receber notificações via email, ou não. |
<br>
<br id="m">

### Publicar conteúdos

```
{{BaseUrl}}/contents
```

**Cabeçalho da requisição:**

| Parâmetro | Valor | Descrição |
| --- | --- | --- |
| Set-Cookie | session_id={seuSessionID} | {seuSessionID} é o session_id que foi obtido na resposta ao fazer login. |

**Corpo da requisição:**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| title | string | O título da publicação. *Obrigatório |
| body | string | O corpo da sua publicação, com formatação em Markdown ou HTML. *Obrigatório |
| status | string | Para o conteúdo realmente ser publicado, o valor deve ser `published`. *Obrigatório |
| source_url | string | O link que vai ficar como fonte de seu post, no formato `https://example.com`. Caso não seja definido, a fonte ficará em branco. |
| slug | string | O slug do seu post. Caso não seja definido, o slug será gerado automaticamente com base no título da publicação. |

</details>


## Instalar e rodar o projeto

Rodar o TabNews em sua máquina local é uma tarefa extremamente simples.

### Dependências globais

Você precisa ter duas principais dependências instaladas:

- Node.js LTS v16 (ou qualquer versão superior)
- Docker Engine v17.12.0 com Docker Compose v1.24.1 (ou qualquer versão superior)

Utiliza `nvm`? Então pode executar `nvm install` na pasta do projeto para instalar e utilizar a versão mais apropriada do Node.js.

### Dependências locais

Então após baixar o repositório, não se esqueça de instalar as dependências locais do projeto:

```bash
npm install
```

### Rodar o projeto

Para rodar o projeto localmente, basta rodar o comando abaixo:

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

#### Manualmente criar um usuário

1. Após subir os serviços, acesse http://localhost:3000/cadastro
2. Preencha os dados e utilize **qualquer email** com formato válido, mesmo que este email não exista, por exemplo: `teste@teste.com`
3. O backend irá enviar um email para o servidor **local** de emails e que pode ser acessado pelo endereço http://localhost:1080/
4. Abra o email de Ativação e acesse o link para ativar sua conta de fato.
5. Com a conta ativa, realize o login: http://localhost:3000/login

#### Utilizar usuários pré-cadastrados

Por padrão, ao rodar o comando `npm run dev` será injetado dois usuários ativados, um com features padrões e outro com features administrativas como a habilidade de rodar as Migrations usando a API ou alterar o conteúdo de outros usuários. Segue abaixo as credenciais destes dois usuários (`"email"` + `"senha"`):

- **Usuário Admin**: `"admin@admin.com"` + `"password"`
- **Usuário padrão**: `"user@user.com"` + `"password"`

## Rodar os testes

Há várias formas de rodar os testes dependendo do que você deseja fazer, mas o primeiro passo antes de fazer qualquer alteração no projeto é rodar os testes de forma geral para se certificar que tudo está passando como esperado. O comando abaixo irá rodar todos os serviços necessários, rodar os testes e em seguida derrubar todos os serviços.

```bash
npm test
```

Caso queira manter os serviços e testes rodando enquanto desenvolve (e rodando novamente a cada alteração), use o comando abaixo:

```bash
npm run test:watch:services
```

Os logs do Serviço Web e Jest (dos testes) irão se misturar, então caso queira rodar eles de forma separada, abra dois terminais separados e rode o seguinte:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:watch
```

Caso não queira dar `watch` em todos os testes e queira isolar apenas 1 arquivo de teste (ou um grupo de testes), você pode utilizar um simples `regex` para dar `match` no que quiser, por exemplo:

```bash
# Rodar apenas /tests/api/v1/_use-cases/registration-flow.test.js
npm run test:watch -- registration-flow

# Rodar todos os testes de "users" da api "v1"
npm run test:watch -- v1/users/

# Rodar apenas /tests/api/v1/users/[username]/patch.test.js
npm run test:watch -- username./patch

# tests/integration/api/v1/contents/[username]/[slug]/get.test.js
npm run test:watch -- contents/.username./.slug./get
```

Observações:

- A forma como é tratado o caminho dos arquivos pode mudar dependendo do seu sistema operacional.
- A forma como o seu terminal interpreta caracteres especiais como `/` ou `[` pode mudar, mas você poderá usar `regex` para evitar usar esses caracteres, como por exemplo utilizar o `.` que representa o `match` com qualquer caractere. Isto foi utilizado nos exemplos acima para evitar os caracteres `[` e `]` dos arquivos.

## Criar novas Migrations

Você pode utilizar o script `migration:create`, por exemplo:

```
npm run migration:create alter table users add tabcoins
```

Isto irá resultar em:

```
Created migration -- ./infra/migrations/1655399502254_alter-table-users-add-tabcoins.js
```

Caso esta nova migração esteja válida, ela será automaticamente executada na próxima vez que você rodar o comando `npm run dev`. Caso contrário, o serviço não irá subir e os logs de erro estarão registrados no arquivo `migrations.log` encontrado na raiz do projeto.

## Commit das alterações

Após finalizar suas alterações e se certificar que todos os testes estão passando com o comando geral `npm test`, chegou a hora de fazer o commit das suas alterações.

Para ser auxiliado no padrão de commit que utilizamos, rode o comando abaixo e siga as instruções:

```bash
npm run commit
```

## Diário de Desenvolvimento

- [Acessar o diário](https://github.com/filipedeschamps/tabnews.com.br/wiki)
