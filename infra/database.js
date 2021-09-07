import { Pool } from "pg";

export default function DatabaseFactory() {
  const poolConfiguration = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: {
      rejectUnauthorized: false,
    },
  };

  // https://github.com/filipedeschamps/tabnews.com.br/issues/84
  if (
    ["test", "development"].includes(process.env.NODE_ENV) ||
    process.env.CI
  ) {
    delete poolConfiguration.ssl;
  }

  const pool = new Pool(poolConfiguration);

  async function query(query) {
    const results = await pool.query(query);
    return results;
  }

  async function getNewConnectedClient() {
    // When manually creating a new connection like this,
    // you need to make sure to close it afterward
    // with the .end() method.
    return await pool.connect();
  }

  return {
    query,
    getNewConnectedClient,
    pool,
  };
}
