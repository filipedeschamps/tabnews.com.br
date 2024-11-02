/* eslint-disable no-console */
const { exec } = require('child_process');

const versionDockerNeeded = 20;
const versionComposeNeeded = 1.29;

exec('docker -v', (err, stdout, stderr) => {
  // eslint-disable-line no-console
  if (err) {
    console.error('error', stderr);
    console.error('❌️ Instalação do Docker não foi localizada, verificar as dependencias do projeto no link');
    console.error('https://github.com/filipedeschamps/tabnews.com.br');
    exec('killall node');
  } else {
    const version = stdout.split(' ')[2];
    const versionNumber = version.split('.')[0];
    if (versionNumber < versionDockerNeeded) {
      console.error(
        '❌️ Instalação do Docker é inferior a necessária para rodar o projeto, verificar as dependencias do projeto no link',
      );
      console.error(`❌️ ${stdout} `);
      console.error('https://github.com/filipedeschamps/tabnews.com.br');
      exec('killall node');
    } else {
      console.log(`✓ ${stdout} `);
    }
  }
});

exec('docker compose version', (err, stdout, stderr) => {
  if (err) {
    console.error('error', stderr);
    console.error('❌️ Plugin compose no Docker não foi localizada, verificar as dependencias do projeto no link');
    console.error('https://github.com/filipedeschamps/tabnews.com.br');
    exec('killall node');
  } else {
    const version = stdout.split('version v')[1];
    const versionNumber = version.split('.');
    if (versionNumber[0] + '.' + versionNumber[1] < versionComposeNeeded) {
      console.error(
        '❌️ Instalação do plugin compose no Docker é inferior a necessária para rodar o projeto, verificar as dependencias do projeto no link',
      );
      console.error(`❌️ ${stdout} `);
      console.error('https://github.com/filipedeschamps/tabnews.com.br');
      exec('killall node');
    } else {
      console.log(`✓ ${stdout} `);
    }
  }
});
