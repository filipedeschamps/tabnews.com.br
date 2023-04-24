### Seção 1:
Print da Issue original: ![331ac22b-2e7f-4a9d-a056-fb2fd2f23496](https://user-images.githubusercontent.com/50780673/222917583-b13e2d85-4ab8-4964-960c-6d390add41f2.jpeg)
Link da Issue original: https://github.com/filipedeschamps/tabnews.com.br/issues/986

### Seção 2:
- **Análise de impacto:**
    1. Entender a engine v2 do reCAPTCHA;
    2. Registrar um novo site no painel reCAPTCHA;
    3. Utilizar API keys (chaves fornecidas pelo reCAPTCHA);
    4. Implementar lógica no backend (validação de token);
    5. Implementar componente no frontend (formulários de autenticação);
    6. Integrar as partes do sistema;
    7. Testar e validar melhoria.

### Seção 3:

- **Estimativa de Impacto de mudança:** estimamos impactos moderados no Frontend devido a ser apenas a adição do componente do reCAPTCHA. Já para o Backend enxergamos grandes impactos devido a toda implementação que envolve a autenticação no Tabnews.
- **Estimativa de Esforço:** é estimado de forma otimista 1 dia de trabalho para concluir a atividade, porém podendo depender mais 1 dependendo de problemas relacionados a implementação que possam surgir.
- **Estimativa de Complexidade:** para o Frontend consideramos uma complexidade de nível baixo, já para o Backend é possível considerar uma complexidade moderada.

### Seção 4:

- **Vídeo:** https://youtu.be/_UaW61A_SOI
- **Impacto de mudança:** 
.env
models/recaptcha.js
package-lock.json
package.json
pages/api/v1/recovery/index.public.js
pages/api/v1/sessions/index.public.js
pages/api/v1/users/index.public.js
pages/cadastro/index.public.js
pages/cadastro/recuperar/index.public.js
pages/login/index.public.js
tests/integration/api/v1/_use-cases/registration-flow.test.js
tests/integration/api/v1/recovery/post.test.js
tests/integration/api/v1/sessions/post.test.js
tests/integration/api/v1/users/firewall.post.test.js
tests/integration/api/v1/users/post.test.js

- **Realização de Esforço:**
Nas telas de autenticação do site (login, cadastro e recuperação de senha) foi adicionado o componente do reCAPTCHA ao final dos formulários. O desafio retornado pelo componente é informado nos headers das APIs de autenticação em questão. O backend recebe o header e faz a requisição para a API do Google para validar se o desafio foi preenchido corretamente. 
- **Realização de Complexidade:** 
A complexidade teve nuances, entre fácil e mediana. Olhando para o front-end vemos que a implementação foi exatamente como planejada e simples, além de ser bem parecida com a POC realizada. Já para o back-end é possível enxergar complexidade mediana, já que algumas coisas precisarão ser modificadas do planejado, e foi necessário um conhecimento sobre a engine reCAPTCHA e a biblioteca react-google-recaptcha.

- **Planejado x Realizado:**
A lógica planejada se manteve a mesma, porém alguns arquivos planejados de alteração foram substituídos ou nem mexidos. Como exemplo, não foi necessário criar um atributo de validação de campo já que o token do reCAPTCHA foi passado no header, não foi necessário criar um erro customizado e não foi mapeado previamente os arquivos de teste que seriam alterados.

**Ademais, apenas a título de curiosidade e contexto, foi planejado aprovar a CR apenas implementando o reCAPTCHA nas autenticações, mas foi visto que seria necessário implementar em todo o site e planejar a implementação de modo que seja compatível com outros serviços que usam as APIs do Tabnews.**
