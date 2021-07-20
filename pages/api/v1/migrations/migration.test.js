import axios from "axios";
import allServicesFactory from "tests/services.js";
import numberOfFilesInFolder from "tests/numberOfFilesInFolder.js";

const allServices = allServicesFactory();

beforeAll(async () => {
  return await allServices.start();
});

describe("[e2e] First GET to /api/v1/migrations", () => {
  test("should list all pending migrations", async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder("./infra/migrations");

    const pendingMigrations = await axios.get(
      allServices.localWebServer.url + "/api/v1/migrations"
    );

    expect(pendingMigrations.status).toEqual(200);
    expect(pendingMigrations.data.length).toEqual(numberOfMigrationFiles);
    expect(pendingMigrations.data[0].path).toBeDefined();
    expect(pendingMigrations.data[0].name).toBeDefined();
    expect(pendingMigrations.data[0].timestamp).toBeDefined();
  });
});

describe("[e2e] First POST to /api/v1/migrations", () => {
  test("should list all migrated migrations", async () => {
    const numberOfMigrationFiles = numberOfFilesInFolder("./infra/migrations");

    const pendingMigrations = await axios.post(
      allServices.localWebServer.url + "/api/v1/migrations"
    );

    expect(pendingMigrations.status).toEqual(201);
    expect(pendingMigrations.data.length).toEqual(numberOfMigrationFiles);
    expect(pendingMigrations.data[0]).toHaveProperty("path");
    expect(pendingMigrations.data[0]).toHaveProperty("name");
    expect(pendingMigrations.data[0]).toHaveProperty("timestamp");
  });
});

describe("[e2e] Second POST to /api/v1/migrations", () => {
  test("should list zero migrated migrations", async () => {
    const pendingMigrations = await axios.post(
      allServices.localWebServer.url + "/api/v1/migrations"
    );

    expect(pendingMigrations.status).toEqual(200);
    expect(pendingMigrations.data.length).toEqual(0);
  });
});

describe("[e2e] Second GET to /api/v1/migrations", () => {
  test("should list all zero pending", async () => {
    const pendingMigrations = await axios.get(
      allServices.localWebServer.url + "/api/v1/migrations"
    );

    expect(pendingMigrations.status).toEqual(200);
    expect(pendingMigrations.data.length).toEqual(0);
  });
});

describe("[e2e] PUT to /api/v1/migrations", () => {
  test("should return 404", async () => {
    try {
      const pendingMigrations = await axios.put(
        allServices.localWebServer.url + "/api/v1/migrations"
      );
    } catch (error) {
      expect(error.response.status).toEqual(404);
    }
  });
});

afterAll(async () => {
  return await allServices.stop();
});
