# Contribuindo

## Solicitação de mudança/Pull Requests

Primeiro crie um fork do repositório [tabnews.com.br](https://github.com/filipedeschamps/tabnews.com.br) para commitar suas alterações. Maneiras de "forkar" um repositório pode ser encontrada na [documentação GitHub](https://docs.github.com/pt/get-started/quickstart/fork-a-repo).

Então, faça o clone do seu repositório para ambiente local:

```sh
# Usando HTTPS
git clone https://github.com/SEU-USUARIO-GITHUB/tabnews.com.br.git
# Usando SSH
git clone git@github.com:SEU-USUARIO-GITHUB/tabnews.com.br.git
```

Em seguida, acesse o seu diretório local

```sh
cd tabnews.com.br
```

Adicione o repositório oficial na sua stream remota:

```sh
# Using HTTPS
git remote add upstream https://github.com/filipedeschamps/tabnews.com.br.git
# Using SSH
git remote add upstream git@github.com/filipedeschamps/tabnews.com.br.git
```

É possível validar que agora você deve ter 2 stream remotas:

```sh
git remote -v
```

## Obter atualizações oficiais

Para manter o repositório local em dia com o repositório oficial:

```sh
git pull upstream main
```

## Escolher uma branch oficial

Antes de inicial a desenvolver, você precisa saber de qual branch se basear para iniciar seu desenvolvimento. Quando em dúvida, use a `main`

| Tipo de desenvolviment |     | Branch |
| :--------------------- | :-: | -----: |
| Documentação           |     | `main` |
| Correção de bug        |     | `main` |
| Novas features         |     | `main` |

```sh
# Entre na branch principal
git checkout main
# Obtenha as atualizações oficiais
git pull upstream main
# Inicie uma nova branch para desenvolvimento
git checkout -b feat/your-feature-name
```

Faça o commit das suas alterações, então envie sua branch local para o seu fork através do comando `git push -u origin` e abra um Pull Request no [repositório oficial do tabnews.com.br](https://github.com/filipedeschamps/tabnews.com.br/) utilizando um template disponível

Commit your changes, then push the branch to your fork with `git push -u fork` and open a pull request on [the Github-issue-templates repository](https://github.com/stevemao/github-issue-templates/) following the template provided.

## Desenvolvendo

Para desenvolver novo código ou alterar algum código já existente, tente manter os nomes de variáveis, classes, métodos, funções coesos dentro do contexto em que são declarados e dê preferencia a linguagem inglesa.

## Escrevendo seus commits

É disponibilizado um script para auxilio e padronização nas mensagens de commit. Para utilizá-lo, execute:

```sh
npm run commit
```

Para a linguagem utilizada no commit, dê preferência ao inglês.

Mas não se preocupe, seguem alguns exemplos para apoio caso não seja de seu domínio:

| Finalidade do commit   | Texto exemplo em inglês       |
| :--------------------- | :---------------------------- |
| Criar uma página "A"   | create A web page             |
| Criar um endpoint HTTP | create GET /api_name endpoint |
