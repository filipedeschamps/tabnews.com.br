# tabnews.com.br

## Documentação API:

### Introdução
A API do TabNews é uma API que retorna diversas informações em relação aos conteúdos criados lá, além de ser possível logar, cadastrar e criar conteúdos.

A comunicação é feita através de HTTPS usando GET ou POST. Tanto a solicitação quanto a resposta são formatadas como JSON e o tipo de conteúdo de ambas é application/json.
<br>

### Change log
-
<br>

### Exemplos
Os exemplos a seguir mostram casos de usos comuns.
<br>

### Obter lista de posts da página inicial
```
https://www.tabnews.com.br/api/v1/contents?page={pagina}&per_page={porPagina}&strategy={estrategia} 
```

| Parâmetros: |  |
|--------------|----------------------------|
| {pagina}    | Página que você deseja acessar|
| {porPagina} | Quantos conteúdos devem ser retornados por página|
| {estrategia} | Classificação dos conteúdos (new, old ou best)|
<br>

### Obter lista de posts de um determinado usuário
```
https://www.tabnews.com.br/api/v1/contents/{user}?page={pagina}&per_page={porPagina}&strategy={estrategia} 
```

| Parâmetros: |  |
|--------------|----------------------------|
| {user} | Nome do usuário que você quer obter os conteúdos | 
| {pagina}    | Página que você deseja acessar|
| {porPagina} | Quantos conteúdos devem ser retornados por página|
| {estrategia} | Classificação dos conteúdos (new, old ou best)|
<br>

### Obter conteúdo de uma publicação
```
https://www.tabnews.com.br/api/v1/contents/{user}/{slug}
```

| Parâmetros: |  |
|--------------|----------------------------|
| {user} | Usuário que você deseja obter o post |
| {slug} | Slug do post que você deseja obter |
<br>

### Obter comentários de uma publicação
```
https://www.tabnews.com.br/api/v1/contents/{user}/{slug}/children
```
| Parâmetros: |  |
|--------------|----------------------------|
| {user} | Usuário que você deseja obter os comentários do post |
| {slug} | Slug do post que você deseja obter os comentários |
<br>

### Obter lista com informações de quantos usuários, posts e/ou comentários foram criados em determinado dia (status)

Para obter quantos usuários foram criados (por dia):
```
https://www.tabnews.com.br/api/v1/analytics/users-created
```

Para obter quantas publicações foram feitas (por dia):
```
https://www.tabnews.com.br/api/v1/analytics/root-content-published
```

Para obter quantos usuários foram criados (por dia):
```
https://www.tabnews.com.br/api/v1/analytics/child-content-published
```
<br>

### Logar usuário
```javascript
const data = {email: "{insira o email aqui}", password: "{insira a senha aqui}"}

fetch('https://www.tabnews.com.br/api/v1/sessions', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then((response) => response.json())
      .then((data) => {
         console.log("Data: ", data)
  })
      .catch((error) => {
         console.log("Error: ", error)
  });
```

Caso ocorra tudo certo ele deve retornar algo parecido com:
```json
Data:
{
  "id": "6fbeca8f-13f1-43e3-b3**-************",
  "token": "e5fba39f8c4ec21cfd50d94ec8f659ed3258e301afe51240786d9ecddc8d35aeecae391ffe73e38d8c**************",
  "expires_at": "yyyy-mm-ddT14:34:08.664Z",
  "created_at": "yyyy-mm-ddT14:34:08.664Z",
  "updated_at": "yyyy-mm-ddT14:34:08.664Z"
}
```

Caso ocorra algum erro ele deve retornar algo como:
```json
Error:
{}
Data:
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
<br>

### Criar usuário

```javascript
const data = {username: "{insira o username aqui}", email: "{insira o email aqui}", password: "{insira a senha aqui}"}

fetch('https://www.tabnews.com.br/api/v1/users', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then((response) => response.json())
      .then((data) => {
         console.log("Data: ", data)
  })
      .catch((error) => {
         console.log("Error: ", error)
  });
  ```
⚠O usuário terá que confirmar o email para acessar a conta⚠
<br>
<br>

## Instalar e rodar o projeto

Rodar o TabNews em sua máquina local é uma tarefa extremamente simples.

### Dependências globais

Você precisa ter duas principais dependências instaladas:

- Node.js v16 LTS (ou qualquer versão superior)
- Docker Engine v17.12.0 com Docker Compose v1.24.1 (ou qualquer versão superior)

Utiliza nvm? Então pode executar `nvm install` na pasta do projeto para instalar e utilizar a versão mais apropriada do Node.js.

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
