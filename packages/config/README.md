# TabNews Config

> Essa versão beta só implementa o comando `tn test`. Ainda não possui os demais comandos.

Ferramenta para configurar um ambiente de desenvolvimento e testes com as mesmas configurações utilizadas no TabNews, incluindo:

- CLI do TabNews
- Variáveis de ambiente com [dotenv-expand](https://www.npmjs.com/package/dotenv-expand)
- Test Runner [Vitest](https://vitest.dev/)
- Linter [ESLint](https://eslint.org/)
- Formatador de código [Prettier](https://prettier.io/)
- Contêineres Docker
  - Banco de dados [PostgreSQL](https://hub.docker.com/_/postgres)
  - Servidor de email [MailCatcher](https://hub.docker.com/r/sj26/mailcatcher)

## Requisitos

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

## Utilização

### Scripts NPM

Adicione scripts no `package.json` do projeto, por exemplo:

```json
{
  "scripts": {
    "dev": "tn --seed",
    "build": "tn build --seed",
    "start": "tn start",
    "test": "tn test run",
    "test:watch": "tn test"
  }
}
```

### CLI

Para iniciar os serviços utilizando as variáveis de ambiente de desenvolvimento, execute o seguinte comando (lembre-se de instalar globalmente a CLI ou usar `npx`):

```bash
tn
```

Todos os demais comandos podem ser consultados com:

```bash
tn --help
```

Alguns comandos possuem subcomandos, que também podem ser consultados através da CLI, por exemplo:

```bash
tn migration -h
```

## Variáveis de ambiente

Aceita arquivos de variáveis de ambiente da mesma forma que o [Next.js](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables). A exceção é a variável `NEXT_PUBLIC_WEBSERVER_PORT` no lugar da `PORT`. Ela permite definir a porta utilizada pelo servidor Next.js local.

De acordo com o comando em execução, as variáveis de ambiente correspondentes serão carregadas a partir dos seguintes arquivos, se existirem:

- Sempre carregadas:

  - `.env` (variáveis padrão)
  - `.env.local` (variáveis locais)

- Carregadas de acordo com o comando em execução:
  - `.env.development` (variáveis de desenvolvimento)
  - `.env.development.local` (variáveis de desenvolvimento locais)
  - `.env.test` (variáveis de teste)
  - `.env.test.local` (variáveis de teste locais)
  - `.env.production` (variáveis de produção)
  - `.env.production.local` (variáveis de produção locais)

A CLI aceita o parâmetro `--env-mode` (ou `-e`) para especificar um ambiente diferente do padrão para o comando, por exemplo, para subir o servidor de desenvolvimento com variáveis de ambiente de teste, mas sem executar os testes, execute:

```bash
tn --env-mode test
```

Aceita as [variáveis de ambiente do Docker Compose](https://docs.docker.com/compose/environment-variables/envvars/), das quais podemos destacar:

- [`COMPOSE_PROJECT_NAME`](https://docs.docker.com/compose/environment-variables/envvars/#compose_project_name): que permite isolar contêineres de diferentes projetos, mesmo usando o mesmo arquivo `compose.yml` padrão do TabNews. É útil também para isolar dados de testes automatizados e demais ambientes de desenvolvimento. Também possibilita executar diferentes projetos em paralelo, desde que não existam outros conflitos, como as portas expostas.

- [`COMPOSE_FILE`](https://docs.docker.com/compose/environment-variables/envvars/#compose_file): Permite usar outro arquivo `compose.yml` caso precise testar ou desenvolver algo com uma configuração mais específica.

### Exemplo de variáveis utilizadas no TabNews

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=tabnews
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

NEXT_PUBLIC_WEBSERVER_HOST=localhost
NEXT_PUBLIC_WEBSERVER_PORT=3000

EMAIL_SMTP_HOST=localhost
EMAIL_SMTP_PORT=1025
EMAIL_HTTP_HOST=localhost
EMAIL_HTTP_PORT=1080
```

Caso defina as variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` com valores diferentes em cada arquivo, é recomendado também especificar um `COMPOSE_PROJECT_NAME` diferente. Caso contrário, será necessário remover o contêiner e o volume para recriar o Postgres com os novos valores sempre que trocar de ambiente.
