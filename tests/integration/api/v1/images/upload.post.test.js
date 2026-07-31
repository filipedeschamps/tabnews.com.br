import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

// Menor GIF válido possível (1x1 pixel transparente)
const smallestGifBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/images/upload', () => {
  describe('Anonymous user', () => {
    test('Should not allow upload without authentication', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
      });

      expect.soft(response.status).toBe(403);
      expect.soft(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "create:content".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('Authenticated user', () => {
    test('Should not allow upload without "image" field', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({});

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"image" é um campo obrigatório e deve ser uma string base64 ou URL.');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:IMAGE_REQUIRED');
    });

    test('Should not allow upload with empty "image" field', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: '',
      });

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"image" é um campo obrigatório e deve ser uma string base64 ou URL.');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:IMAGE_REQUIRED');
    });

    test('Should not allow upload with non-string "image" field', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: 12345,
      });

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"image" é um campo obrigatório e deve ser uma string base64 ou URL.');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:IMAGE_REQUIRED');
    });

    test('Should not allow invalid "expiration" value (too small)', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
        expiration: 10,
      });

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"expiration" deve ser um número entre 60 e 15552000 (segundos).');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:INVALID_EXPIRATION');
    });

    test('Should not allow invalid "expiration" value (too large)', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
        expiration: 99999999,
      });

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"expiration" deve ser um número entre 60 e 15552000 (segundos).');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:INVALID_EXPIRATION');
    });

    test('Should not allow non-numeric "expiration" value', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
        expiration: 'invalid',
      });

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"expiration" deve ser um número entre 60 e 15552000 (segundos).');
      expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:INVALID_EXPIRATION');
    });

    test.skipIf(!process.env.IMGBB_API_KEY)('Should upload image successfully with valid base64', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
      });

      expect.soft(response.status).toBe(201);
      expect(responseBody.url).toBeDefined();
      expect(responseBody.url).toMatch(/^https?:\/\//);
      expect(responseBody.display_url).toBeDefined();
      expect(responseBody.delete_url).toBeDefined();
      expect(responseBody.image).toBeDefined();
    });

    test.skipIf(!process.env.IMGBB_API_KEY)('Should upload image successfully with expiration', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/images/upload');
      await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post({
        image: smallestGifBase64,
        expiration: 600,
      });

      expect.soft(response.status).toBe(201);
      expect(responseBody.url).toBeDefined();
      expect(responseBody.url).toMatch(/^https?:\/\//);
    });

    test('Should return 500 when IMGBB_API_KEY is not configured', async () => {
      const originalKey = process.env.IMGBB_API_KEY;
      delete process.env.IMGBB_API_KEY;

      try {
        const requestBuilder = new RequestBuilder('/api/v1/images/upload');
        await requestBuilder.buildUser();

        const { response, responseBody } = await requestBuilder.post({
          image: smallestGifBase64,
        });

        expect.soft(response.status).toBe(500);
        expect.soft(responseBody.status_code).toBe(500);
        expect(responseBody.name).toBe('InternalServerError');
        expect(responseBody.message).toBe('Chave da API do ImgBB não configurada.');
        expect(responseBody.error_location_code).toBe('CONTROLLER:IMAGES:UPLOAD:API_KEY_NOT_CONFIGURED');
      } finally {
        if (originalKey) {
          process.env.IMGBB_API_KEY = originalKey;
        }
      }
    });
  });
});
