# Instalando Node.js

### <strong>Linux</strong>

Para ter a versão que exatamente você deseja instalar no Linux, recomendo utilizar o tutorial do [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions).
<br>Segue um exemplo retirado da página para instalar o Node.js em máquinas com a distribuição Ubuntu e seus derivados:

```
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\

sudo apt-get install -y nodejs
```

<strong>Dica:</strong> caso você queira ou precise ter várias versões do Node.js em sua máquina, você pode utilizar o [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm) que é uma ferramenta que permite que você possa ter várias versões e possa alterar de versão quando desejar trocar de projeto, por exemplo.

### <strong>Windows ou Mac</strong>

Se você utiliza Windows ou Mac o processo de instalação é mais simples.
<br>Acesse a página oficial do Node.js [clicando aqui](https://nodejs.org), baixe o arquivo de instalação do seu sistema com uma versão maior ou a 16 e instale em sua máquina.

# Instalando Docker e Docker Compose

### <strong>Linux</strong>

Para instalar o Docker e Docker Compose em uma distruição Ubuntu e seus derivados o processo é simples. Execute o seguinte comando em seu terminal:

```
sudo apt-install docker.io docker-compose
```

Execute mais esses 2 comandos para permitir o Docker executar sem necessitar permissão de administrador:

```
sudo groupadd docker

sudo gpasswd -a $USER docker
```

Após isso reinicie sua máquina.
<br></br>
<strong>Outros tutoriais de instalação:</strong>
[Windows](https://www.youtube.com/watch?v=sYsIoWtS5LY&ab_channel=GeranetTechnology.) -
[Mac](https://www.youtube.com/watch?v=18_1yMvZlqY&ab_channel=Espa%C3%A7oDigital) -
[OpenSuse](https://en.opensuse.org/Docker#:~:text=To%20install%20the%20docker%20and,was%20successful%2C%20%22Finish%22.) -
[Fedora](https://docs.docker.com/engine/install/fedora/)
