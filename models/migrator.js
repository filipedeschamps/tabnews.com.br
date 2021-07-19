import migrationRunner from "node-pg-migrate";

export default function Migrator(options = {}) {
  const defaultConfigurations = {
    dbClient: options.databaseClient,
    dir: "./infra/migrations",
    direction: "up",
    migrationsTable: "migrations",
    verbose: true,
  };

  async function listPendingMigrations() {
    const pendingMigrations = await migrationRunner({
      ...defaultConfigurations,
      dryRun: true,
    });

    return pendingMigrations;
  }

  async function runPendingMigrations() {
    const migratedMigrations = await migrationRunner({
      ...defaultConfigurations,
      dryRun: false,
    });

    return migratedMigrations;
  }

  return {
    listPendingMigrations,
    runPendingMigrations,
  };
}
