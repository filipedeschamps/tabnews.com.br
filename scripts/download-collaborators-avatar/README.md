### Baixar avatar dos colaboradores

Código simples escrito em JavaScript para realizar o download do avatar de todos os colaboradores do projeto para construir a tela Em Construção.

#### Como executar?
1. Devido o repositório ser privado é necessário utilizar um *access token* para acessar as informações. Para gerá-lo bastar acessar https://github.com/settings/tokens e clicar no botão **Generate New Token**. 
2. Instale as depedências utilizando `yarn` ou `npm install`.
3. Crie um arquivo `.env` na raiz deste projeto com o seguinte formato  `AUTH_TOKEN=SEU_TOKEN_AQUI`. Substitua `SEU_TOKEN_AQUI` pelo token que foi gerado anteriormente. 
4. Execute o script `dev`

O codígo foi desenvolvido o padrão de projeto **factory**, onde cada funcão é divida em uma arquivo separado e fabrica 