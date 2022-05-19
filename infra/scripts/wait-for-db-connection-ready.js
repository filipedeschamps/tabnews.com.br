const { exec } = require('node:child_process');
const { sleep } = require('../utils');

/**
 * Check Postgres database connection status
 * This is a recursive function that'll execute health check pg_isready command until postgres is accepting connection
 *
 * References: https://www.postgresql.org/docs/current/app-pg-isready.html
 */
const healthCheckDB = async () => {
  const retryTimeMs = 3000; // 3 seconds
  const retryTimeInSeconds = retryTimeMs / 1000;

  exec(`docker exec postgres-dev pg_isready`, async (error, stdout, stderr) => {
    healthCheckStatus = stdout;
    console.log('health check postgres: ', healthCheckStatus);

    if (healthCheckStatus?.indexOf('accepting connections') != -1) return;

    console.log('Falha ao tentar conectar com o banco de dados');
    console.log(`Uma nova tentativa será feita em ${retryTimeInSeconds.toFixed(2)}s ...`);
    await sleep(retryTimeMs);

    return healthCheckDB();
  });
};

(async () => {
  await healthCheckDB();
})();
