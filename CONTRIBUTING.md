# Contribuindo com o TabNews

Primeiramente, agradecemos por dedicar seu tempo para contribuir com o projeto! 🎉

A seguir, temos um guia para lhe ajudar a contribuir com o TabNews através de _issues_ e _pull requests_. Se você ficar com alguma dúvida sobre o processo, [faça uma pergunta](https://github.com/filipedeschamps/tabnews.com.br/issues/new?labels=dúvida&projects=&template=3_question.yml) na parte de issues deste repositório.

**Conteúdo**

- [Reportar privadamente problemas de segurança](#reportar-privadamente-problemas-de-segurança)
- [Participar de debates em issues do repositório](#participar-de-debates-em-issues-do-repositório)
- [Participar de revisões de Pull Requests (PRs)](#participar-de-revisões-de-pull-requests-prs)
- [Desenvolver o código-fonte](#desenvolver-o-código-fonte)
  - [Rodar o lint do código](#rodar-o-lint-do-código)
  - [Criar novas Migrations](#criar-novas-migrations)
  - [Commit das alterações](#commit-das-alterações)
  - [Enviar pull requests](#enviar-pull-requests)

## Reportar privadamente problemas de segurança

Caso tenha encontrado alguma falha de segurança, pedimos que [reporte de forma privada pelo GitHub](https://github.com/filipedeschamps/tabnews.com.br/security/advisories/new). Isso permite discutir detalhes da vulnerabilidade de modo privado com os mantenedores do repositório sem o vazamento da vulnerabilidade ou de informações confidenciais.

Você pode seguir [o tutorial do GitHub](https://docs.github.com/pt/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability#privately-reporting-a-security-vulnerability) sobre como fazer esse tipo de relato.

## Participar de debates em issues do repositório

Sugestões e reportes de bugs são feitos através de issues. Antes de criar um novo, [pesquise se o assunto já está sendo abordado](https://github.com/filipedeschamps/tabnews.com.br/issues) e complemente o debate com o seu ponto de vista ou com uma sugestão de implementação, se necessário.

Para abrir um issue, utilize os templates disponíveis clicando em [novo issue](https://github.com/filipedeschamps/tabnews.com.br/issues/new/choose).

O título, descrição e comentários devem ser feitos em português.

## Participar de revisões de Pull Requests (PRs)

Mesmo não sendo um mantenedor do repositório, você também pode revisar os pull requests, apontando erros que encontrou enquanto lia o código ou testava a implementação. Isso ajudará quem criou o PR e a pessoa que for avaliar o código antes de realizar o merge, possibilitando um processo de integração mais rápido.

Se você não possui certeza sobre algo, deixe claro no seu comentário para que um mantenedor possa responder suas dúvidas.

## Desenvolver o código-fonte

Se o problema que você quer resolver ainda não estiver documentado em um issue, então [leia o tópico sobre issues](#participar-de-debates-em-issues-do-repositório) e primeiro exponha o problema, depois proponha a solução (no próprio issue e sem preocupação com a implementação). Isso evitará que você invista seu tempo realizando uma modificação no código que não será aceita por não ser algo desejado ou que o comportamento esperado ainda não foi bem definido.

Se você está procurando algo para desenvolver como sendo a sua primeira interação com o código do repositório, você pode procurar por [issues com o label _"good first issue"_](https://github.com/filipedeschamps/tabnews.com.br/contribute), que são tarefas que não exigem conhecimento aprofundado sobre o código do TabNews, e que são possíveis até para quem nunca fez uma contribuição para um projeto de código aberto.

As alterações no código devem estar em inglês (nomes de funções, variáveis etc.) e seguir o padrão do projeto. Para entender como rodar o projeto e realizar suas alterações, leia as seções relacionadas no [README](/README.md#instalar-e-rodar-o-projeto).

### Rodar o lint do código

O seu código deve estar de acordo com o padrão do projeto. Para verificar se existe algum erro de lint, você pode usar o comando:

```bash
npm run lint
```

Alguns erros podem ser corrigidos automaticamente usando o comando abaixo, mas outros precisarão ser corrigidos de forma manual.

```bash
npm run lint:fix
```

Este processo será realizado automaticamente quando você commitar suas alterações.

### Criar novas Migrations

Se você está desenvolvendo algo que envolve uma alteração no banco de dados, você pode utilizar o script `migration:create` para criar uma nova migração, por exemplo:

```
npm run migration:create alter table users add tabcoins
```

Isto irá resultar em:

```
Created migration -- ./infra/migrations/1655399502254_alter-table-users-add-tabcoins.js
```

Caso esta nova migração esteja válida, ela será automaticamente executada na próxima vez que você rodar o comando `npm run dev`. Caso contrário, o serviço não irá subir e os logs de erro estarão registrados no arquivo `migrations.log` encontrado na raiz do projeto.

### Templates de email

Os templates de email estão localizados em `models/transactional/emails`, eles utilizam o [react-email](https://react.email/) para a composição do layout e renderização.

Para visualizar e testar os templates, você pode utilizar o comando:

```bash
npm run email
```

### Commit das alterações

Após finalizar suas alterações e se certificar que todos os testes estão passando com o comando geral `npm test`, chegou a hora de fazer o commit das suas alterações.

Para ser auxiliado no padrão de commit que utilizamos, rode o comando abaixo e siga as instruções. **A mensagem de commit deve estar em inglês.**

```bash
npm run commit
```

### Enviar pull requests

Após realizar as alterações, você pode [criar um novo pull request](https://github.com/filipedeschamps/tabnews.com.br/compare). A descrição estará pré-preenchida com comentários, que servem para te guiar a criar a descrição adequada, contendo as modificações realizadas no código e qual o impacto delas. Isso irá facilitar a revisão do PR por colaboradores do repositório. O título e a descrição do PR devem estar em português, e os commits em inglês. Para mais detalhes sobre a criação de um pull request, consulte a [documentação do GitHub](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).

Se você percebeu que alguma verificação não está passando no PR, pode corrigir localmente e realizar um novo commit. Caso tudo esteja passando, basta aguardar a revisão do código por outros colaboradores do projeto. Depois de revisado, você pode precisar realizar alguma modificação. Durante o processo de revisão, um mantenedor do repositório poderá liberar a implantação na Vercel para criar uma versão no ambiente de homologação com o código do seu PR, gerando um link exclusivo para esse ambiente.

Quando as revisões forem feitas e aceitarem seu código, um mantenedor do repositório poderá realizar o merge, e então as suas modificações estarão rodando em produção 🎉.
