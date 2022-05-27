# tabnews.com.br

## Diário de Desenvolvimento

- [Acessar o diário](https://github.com/filipedeschamps/tabnews.com.br/wiki)

## Instalar e rodar o projeto

Rodar o TabNews em sua máquina local é uma tarefa extremamente simples.

### Dependências globais

Você precisa ter duas principais dependências instaladas:

- Node.js 14.18.3 (ou qualquer versão superior)
- Docker Engine 17.12.0 com Docker Compose 1.24.1 (ou qualquer versão superior)

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

### Criar seu primeiro usuário

1. Após subir os serviços, acesse http://localhost:3000/cadastro
2. Preencha os dados e utilize **qualquer email** com formato válido, mesmo que este email não exista, por exemplo: `teste@teste.com`
3. O backend irá enviar um email para o servidor **local** de emails e que pode ser acessado pelo endereço http://localhost:1080/
4. Abra o email de Ativação e acesse o link para ativar sua conta de fato.
5. Com a conta ativa, realize o login: http://localhost:3000/login

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

Caso não queira "watch" todos os testes e queira isolar apenas 1 arquivo de teste (ou um grupo de testes), localize o nome dos arquivos e inclua eles no comando anterior, por exemplo:

```bash
# Rodar apenas /tests/api/v1/_use-cases/registration-flow.test.js
npm run test:watch -- registration-flow

# Rodar todos os testes de "users" da api "v1"
npm run test:watch -- v1/users/

# Rodar apenas /tests/api/v1/users/[username]/patch.test.js
npm run test:watch -- username]/patch
```

Observações:

- A forma como é tratado o caminho dos arquivos pode mudar dependendo do seu sistema operacional.
- A forma como o seu terminal interpreta caracteres especiais como `/` ou `[` pode mudar, mas você poderá fazer o _escape_ deles adicionando o caractere `\` na frente, por exemplo: `\[`.

## Commit das alterações

Após finalizar suas alterações e se certificar que todos os testes estão passando com o comando geral `npm test`, chegou a hora de fazer o commit das suas alterações.

Para ser auxiliado no padrão de commit que utilizamos, rode o comando abaixo e siga as instruções:

```bash
npm run commit
```
