import database from 'infra/database';

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
    const maxConnectionsResult = await database.query('SHOW max_connections');
    const maxConnectionsValue = maxConnectionsResult.rows[0].max_connections;

    const openConnectionsResult = await database.query(
      'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
      [process.env.POSTGRES_DB]
    );
    const openConnectionsValue = openConnectionsResult.rows[0].opened_connections;

    result = {
      status: 'healthy',
      max_connections: parseInt(maxConnectionsValue, 10),
      opened_connections: parseInt(openConnectionsValue, 10),
    };
  } catch (error) {
    result = {
      status: 'unhealthy',
    };
  }

  return result;
}

export default Object.freeze({
  getDependencies,
});
