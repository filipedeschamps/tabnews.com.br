## 💡 Sobre
Esse repositório contempla a execução do tabnews como extensão de navegadores. Atualmente é carregado uma página estática até a disponilização das API's.

## 🛠️ Como executar

Entre no diretório `extesion` e execute os comandos abaixo:

```bash
$ npm install
$ npm run dev:chrome // para executável no chrome ou
$ npm run dev:firefox // para executável no firefox ou
$ npm run dev:opera // para executável no opera
```
Ao finalizar a execução, será criado uma pasta `dist` com os arquivos necessário para instalar a extensão

<img src="./static/diretorio_dist.png">

Agora, basta carregar essa pasta nas extensões do navegador.

Ex: Chrome

* Acessar `chrome://extensions/` nas buscas do browser;

<img src="./static/endereco_extensao_chrome.png">

* Habilitar modo de desenvolvedor;

<img src="./static/habilitar_dev_chrome.png">

* Clique em "Carregar sem compactação";

<img src="./static/carregar_ext_chrome.png">

* Selecione o diretório `dist` e clique em "Selecionar Pasta";

<img src="./static/selecionar_dist_extension.png">

* Habilite a extensão;

<img src="./static/habilitar_extensao.png">

* Abra uma nova aba e verá a extensão carregada.

<img src="./static/abrir_nova_aba.png">