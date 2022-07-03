import database from 'infra/database';
import { performance } from 'perf_hooks';
import logger from 'infra/logger';

async function getDependencies() {
  const dependenciesHandlersToCheck = [
    {
      name: 'database',
      handler: checkDatabaseDependency,
    },
    {
      name: 'webserver',
      handler: checkWebserverDependency,
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
    const firstQueryTimer = performance.now();
    const [maxConnectionsResult, superuserReservedConnectionsResult] = await database.query(
      'SHOW max_connections; SHOW superuser_reserved_connections;'
    );
    const maxConnectionsValue = maxConnectionsResult.rows[0].max_connections;
    const superuserReservedConnectionsValue = superuserReservedConnectionsResult.rows[0].superuser_reserved_connections;
    const firstQueryDuration = performance.now() - firstQueryTimer;

    const secondQueryTimer = performance.now();
    const openConnectionsResult = await database.query({
      text: 'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
      values: [process.env.POSTGRES_DB],
    });
    const openConnectionsValue = openConnectionsResult.rows[0].opened_connections;
    const secondQueryDuration = performance.now() - secondQueryTimer;

    const thirdQueryTimer = performance.now();
    const versionResult = await database.query('SHOW server_version;');
    const versionResultValue = versionResult.rows[0].server_version;
    const thirdQueryDuration = performance.now() - thirdQueryTimer;

    result = {
      status: 'healthy',
      max_connections: parseInt(maxConnectionsValue) - parseInt(superuserReservedConnectionsValue),
      opened_connections: openConnectionsValue,
      latency: {
        first_query: firstQueryDuration,
        second_query: secondQueryDuration,
        third_query: thirdQueryDuration,
      },
      version: versionResultValue,
    };
  } catch (error) {
    logger.error(error);
    result = {
      status: 'unhealthy',
    };
  }

  return result;
}

async function checkWebserverDependency() {
  return {
    status: 'healthy',
    provider: process.env.VERCEL ? 'vercel' : 'local',
    environment: process.env.VERCEL_ENV ? process.env.VERCEL_ENV : 'local',
    aws_region: process.env.AWS_REGION,
    vercel_region: process.env.VERCEL_REGION,
    timezone: process.env.TZ,
    last_commit_author: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN,
    last_commit_message: process.env.VERCEL_GIT_COMMIT_MESSAGE,
    last_commit_message_sha: process.env.VERCEL_GIT_COMMIT_SHA,
    version: process.version,
  };
}

export default Object.freeze({
  getDependencies,
});
