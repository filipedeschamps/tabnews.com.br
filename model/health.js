import database from 'infra/database';

export default function Health() {
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
      const openConnectionsResult = await database.query(
        'SELECT sum(numbackends) as opened_connections FROM pg_stat_database'
      );
      const { opened_connections } = openConnectionsResult.rows[0];

      result = {
        status: 'healthy',
        opened_connections: parseInt(opened_connections),
      };
    } catch (err) {
      console.error('database dependency might be down: ', err);

      result = {
        status: 'unhealthy',
      };
    }

    return result;
  }

  return {
    getDependencies,
  };
}
