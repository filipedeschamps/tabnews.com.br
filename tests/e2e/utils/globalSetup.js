const { exec } = require('child_process');

async function globalSetup() {
  exec('npm run migration:run', (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    // if (stdout) {
    // console.log(stdout);
    // }
  });
}

module.exports = globalSetup;
