import migratorFactory from "infra/migrator.js";

export default async function Migrations(request, response) {
  const migrator = migratorFactory();

  try {
    if (request.method === "GET") {
      const pendingMigrations = await migrator.listPendingMigrations();
      return response.status(200).json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrator.runPendingMigrations();

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
    }

    // TODO: create a pattern with Custom Errors.
    // Do not rely on this response right now.
    return response.status(404).json({ error: "Not Found" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
}
