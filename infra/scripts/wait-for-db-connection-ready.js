const { exec } = require('node:child_process');
const retry = require('async-retry');

/**
 * Check Postgres database connection status
 * This is a function that'll execute health check pg_isready command until postgres is accepting connection
 *
 * References: https://www.postgresql.org/docs/current/app-pg-isready.html
 */
const healthCheckDB = async () => {
  return await retry(
    async (bail, tries) => {
      if (tries > 25) {
        console.log(
          `> Trying to connect to Database #${tries}. Are you running the postgres container? Run npm run services:up to start database service`
        );
      }

      return await new Promise((resolve, reject) => {
        exec(`docker exec postgres-dev pg_isready`, async (error, stdout, stderr) => {
          healthCheckStatus = stdout;
          console.log('health check postgres: ', healthCheckStatus);

          if (healthCheckStatus?.indexOf('accepting connections') != -1) {
            resolve();
            return;
          }

          const reason = 'Failed to connect to database. A new attempt will be made in 3 seconds ...';
          console.log(reason);

          reject(reason);
        });
      });
    },
    {
      forever: true,
      minTimeout: 3000,
      maxTimeout: 3000,
      factor: 1.1,
    }
  );
};

(async () => {
  await healthCheckDB();
})();
