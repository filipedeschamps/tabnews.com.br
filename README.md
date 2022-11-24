<img src="https://github.com/mavinsi/tabnews.com.br/blob/main/public/first-banner.png?raw=true">


<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"> <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"> <img src="https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white">


## 🚀 Instalar e rodar o projeto

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

## 👨‍💻 Rodar os testes

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

## ↔️ Criar novas Migrations

Você pode utilizar o script `migration:create`, por exemplo:

```
npm run migration:create alter table users add tabcoins
```

Isto irá resultar em:

```
Created migration -- ./infra/migrations/1655399502254_alter-table-users-add-tabcoins.js
```

Caso esta nova migração esteja válida, ela será automaticamente executada na próxima vez que você rodar o comando `npm run dev`. Caso contrário, o serviço não irá subir e os logs de erro estarão registrados no arquivo `migrations.log` encontrado na raiz do projeto.

## 📚 Commit das alterações

Após finalizar suas alterações e se certificar que todos os testes estão passando com o comando geral `npm test`, chegou a hora de fazer o commit das suas alterações.

Para ser auxiliado no padrão de commit que utilizamos, rode o comando abaixo e siga as instruções:

```bash
npm run commit
```

## 📒 Diário de Desenvolvimento

- [Acessar o diário](https://github.com/filipedeschamps/tabnews.com.br/wiki)

## ⛑️ Contribuidores

<a href="https://github.com/filipedeschamps/tabnews.com.br/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=filipedeschamps/tabnews.com.br&max=500" alt="Lista de contribuidores" width="100%"/>
</a>
