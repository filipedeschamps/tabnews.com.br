import fetch from "cross-fetch";
import orchestratorFactory from "tests/orchestrator.js";
import numberOfFilesInFolder from "tests/numberOfFilesInFolder.js";

const orchestrator = orchestratorFactory();

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
});

describe("[e2e] First GET to /api/v1/migrations", () => {
  test("should list all pending migrations", async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder("./infra/migrations");

    const pendingMigrationsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/migrations`
    );
    const pendingMigrationsBody = await pendingMigrationsResponse.json();

    expect(pendingMigrationsResponse.status).toEqual(200);
    expect(pendingMigrationsBody.length).toEqual(numberOfMigrationFiles);
    expect(pendingMigrationsBody[0].path).toBeDefined();
    expect(pendingMigrationsBody[0].name).toBeDefined();
    expect(pendingMigrationsBody[0].timestamp).toBeDefined();
  });
});

describe("[e2e] First POST to /api/v1/migrations", () => {
  test("should list all migrated migrations", async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder("./infra/migrations");

    const migrationsMigratedResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/migrations`,
      {
        method: "post",
      }
    );
    const migrationsMigratedBody = await migrationsMigratedResponse.json();

    expect(migrationsMigratedResponse.status).toEqual(201);
    expect(migrationsMigratedBody.length).toEqual(numberOfMigrationFiles);
    expect(migrationsMigratedBody[0]).toHaveProperty("path");
    expect(migrationsMigratedBody[0]).toHaveProperty("name");
    expect(migrationsMigratedBody[0]).toHaveProperty("timestamp");
  });
});

describe("[e2e] Second POST to /api/v1/migrations", () => {
  test("should list zero migrated migrations", async () => {
    const migrationsMigratedResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/migrations`,
      {
        method: "post",
      }
    );
    const migrationsMigratedBody = await migrationsMigratedResponse.json();

    expect(migrationsMigratedResponse.status).toEqual(200);
    expect(migrationsMigratedBody.length).toEqual(0);
  });
});

describe("[e2e] Second GET to /api/v1/migrations", () => {
  test("should list all zero pending", async () => {
    const pendingMigrationsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/migrations`
    );
    const pendingMigrationsBody = await pendingMigrationsResponse.json();

    expect(pendingMigrationsResponse.status).toEqual(200);
    expect(pendingMigrationsBody.length).toEqual(0);
  });
});

describe("[e2e] PUT to /api/v1/migrations", () => {
  test("should return 404", async () => {
    const putMigrations = await fetch(
      `${orchestrator.webserverUrl}/api/v1/migrations`,
      {
        method: "put",
      }
    );
    expect(putMigrations.status).toEqual(404);
  });
});
