import { Pool } from "pg";

export default function DatabaseFactory() {
  const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });

  async function query(query) {
    const results = await pool.query(query);
    return results;
  }

  async function getNewConnectionClient() {
    // When manually creating a new connection like this,
    // you need to make sure to close it afterward
    // with the .end() method.
    return await pool.connect();
  }

  return {
    query,
    getNewConnectionClient,
  };
}
