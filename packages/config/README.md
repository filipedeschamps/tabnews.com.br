# TabNews Config

Configurações compartilhadas entre os pacotes e o projeto do TabNews:

- Test Runner [Vitest](https://vitest.dev/)
- Linter [ESLint](https://eslint.org/)
- Formatador de código [Prettier](https://prettier.io/)
- [lint-staged](https://www.npmjs.com/package/lint-staged)

## Requisitos

- [Node.js](https://nodejs.org/)

## Utilização

O pacote expõe configurações prontas para serem estendidas nos arquivos de configuração de cada projeto:

```js
// vitest.config.mjs
import defineConfig from '@tabnews/config/vitest';

export default defineConfig({
  // ...
});
```

```js
// eslint.config.cjs
module.exports = require('@tabnews/config/eslint');
```

```js
// prettier.config.cjs
module.exports = require('@tabnews/config/prettier');
```

```js
// lint-staged.config.cjs
module.exports = require('@tabnews/config/lint-staged');
```

### Scripts de teste

Cada pacote roda seus próprios testes a partir da raiz do monorepo, filtrando pelo diretório atual:

```json
{
  "scripts": {
    "test": "vitest --root ../.. watch \"$PWD\"",
    "test:run": "vitest --root ../.. run \"$PWD\""
  }
}
```
