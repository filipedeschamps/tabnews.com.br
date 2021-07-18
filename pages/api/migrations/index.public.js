import databaseFactory from "infra/database.js";
import migratorFactory from "models/migrator.js";

export default async function Migrations(request, response) {
  const database = databaseFactory();
  const databaseClient = await database.getNewConnectionClient();
  const migrator = migratorFactory({ databaseClient: databaseClient });

  try {
    if (request.method === "GET") {
      const pendingMigrations = await migrator.listPendingMigrations();
      return response.json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrator.runPendingMigrations();
      return response.json(migratedMigrations);
    }

    // TODO: create a pattern with Custom Errors.
    // Do not rely on this response right now.
    return response.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return response.status(500).json(error);
  } finally {
    databaseClient.end();
  }
}
