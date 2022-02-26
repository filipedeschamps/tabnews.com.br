import database from 'infra/database';
import { performance } from 'perf_hooks';

async function getDependencies() {
  const dependenciesHandlersToCheck = [
    {
      name: 'database',
      handler: checkDatabaseDependency,
    },
  ];

  const promises = dependenciesHandlersToCheck.map(async ({ name, handler }) => {
    const dependencyResult = await handler();

    return {
      name,
      result: dependencyResult,
    };
  });

  const checkedDependencies = await Promise.all(promises);

  // group dependencies by name
  return checkedDependencies.reduce((accumulator, currentDependency) => {
    accumulator[currentDependency.name] = currentDependency.result;

    return accumulator;
  }, {});
}

async function checkDatabaseDependency() {
  let result;
  try {
    const startTimer = performance.now();
    const maxConnectionsResult = await database.query(
      'SELECT rolconnlimit as max_connections FROM pg_roles WHERE rolname = $1;',
      [process.env.POSTGRES_USER]
    );
    const timerDuration = performance.now() - startTimer;
    const maxConnectionsValue = maxConnectionsResult.rows[0].max_connections;

    const openConnectionsResult = await database.query(
      'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
      [process.env.POSTGRES_DB]
    );
    const openConnectionsValue = openConnectionsResult.rows[0].opened_connections;

    result = {
      status: 'healthy',
      max_connections: parseInt(maxConnectionsValue),
      opened_connections: openConnectionsValue,
      latency: timerDuration,
    };
  } catch (error) {
    console.log(error);
    result = {
      status: 'unhealthy',
    };
  }

  return result;
}

export default Object.freeze({
  getDependencies,
});
