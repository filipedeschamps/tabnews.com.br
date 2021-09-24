import database from 'infra/database';

export default function DatabaseHealthIndicator() {
  async function handle() {
    let result = {};
    let connection = null;

    try {
      connection = await database.getNewConnectedClient();
      const openConnectionsResult = await connection.query(
        'SELECT sum(numbackends) as opened_connections FROM pg_stat_database'
      );
      const { opened_connections } = openConnectionsResult.rows[0];

      // If the opened_connections query has returned, we have two things that prooves database liveness:
      // 1 - Queries are running successfully
      // 2 - We have active clients.
      result = {
        status: 'healthy',
        opened_connections,
      };
    } catch (error) {
      //TODO: How to handle degraded status?
      console.log('database might be down', error);
      result = {
        status: 'unhealthy',
      };
    } finally {
      connection?.end();
    }

    return {
      name: 'database',
      result,
    };
  }

  return {
    handle,
  };
}
