/* eslint-disable import/namespace */
import { faker } from '@faker-js/faker';
import { version as uuidVersion } from 'uuid';

import * as errors from 'errors';

const testValues = [
  {
    name: 'ForbiddenError',
    defaultValues: {
      message: 'Você não possui permissão para executar esta ação.',
      action: 'Verifique se você possui permissão para executar esta ação.',
    },
    staticValues: {
      statusCode: 403,
      errorId: expect.any(String),
      context: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'InternalServerError',
    defaultValues: {
      message: 'Um erro interno não esperado aconteceu.',
      action: "Informe ao suporte o valor encontrado no campo 'error_id'.",
      statusCode: 500,
    },
    staticValues: {
      context: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'NotFoundError',
    defaultValues: {
      message: 'Não foi possível encontrar este recurso no sistema.',
      action: 'Verifique se o caminho (PATH) está correto.',
    },
    staticValues: {
      statusCode: 404,
      context: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'ServiceError',
    defaultValues: {
      message: 'Serviço indisponível no momento.',
      action: 'Verifique se o serviço está disponível.',
      statusCode: 503,
    },
    staticValues: {
      key: undefined,
      type: undefined,
    },
  },
  {
    name: 'TooManyRequestsError',
    defaultValues: {
      message: 'Você realizou muitas requisições recentemente.',
      action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
    },
    staticValues: {
      statusCode: 429,
      errorId: expect.any(String),
      requestId: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'UnauthorizedError',
    defaultValues: {
      message: 'Usuário não autenticado.',
      action: 'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
    },
    staticValues: {
      statusCode: 401,
      errorId: expect.any(String),
      context: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'UnprocessableEntityError',
    defaultValues: {
      message: 'Não foi possível realizar esta operação.',
      action: 'Os dados enviados estão corretos, porém não foi possível realizar esta operação.',
    },
    staticValues: {
      statusCode: 422,
      errorId: expect.any(String),
      requestId: undefined,
      context: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'ValidationError',
    defaultValues: {
      message: 'Um erro de validação ocorreu.',
      action: 'Ajuste os dados enviados e tente novamente.',
      statusCode: 400,
    },
    staticValues: {
      errorId: expect.any(String),
      requestId: undefined,
      databaseErrorCode: undefined,
    },
  },
  {
    name: 'MethodNotAllowedError',
    defaultValues: {
      message: 'Método não permitido para este recurso.',
      action: 'Verifique se o método HTTP utilizado é válido para este recurso.',
    },
    staticValues: {
      statusCode: 405,
      context: undefined,
      key: undefined,
      type: undefined,
      databaseErrorCode: undefined,
    },
  },
];

describe('Custom Errors', () => {
  describe.each(testValues)('$name', ({ name, defaultValues, staticValues }) => {
    it('should create an instance of the error class', () => {
      expect(new errors[name]({})).toBeInstanceOf(errors[name]);
    });

    it('should have the correct default values', () => {
      const errorInstance = new errors[name]({});

      expect(errorInstance).toStrictEqual(
        expect.objectContaining({
          name,
          errorId: expect.any(String),
          stack: undefined,
          requestId: undefined,
          context: undefined,
          errorLocationCode: undefined,
          key: undefined,
          type: undefined,
          databaseErrorCode: undefined,
          ...defaultValues,
          ...staticValues,
        }),
      );
      expect(uuidVersion(errorInstance.errorId)).toBe(4);
    });

    it('should allow custom values to be set', () => {
      const customValues = {
        message: faker.lorem.sentence(),
        stack: faker.lorem.sentence(),
        action: faker.lorem.sentence(),
        statusCode: faker.number.int({ min: 100, max: 599 }),
        errorId: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        context: { [faker.lorem.word()]: faker.lorem.word() },
        errorLocationCode: faker.lorem.word(),
        key: faker.lorem.word(),
        type: faker.lorem.word(),
        databaseErrorCode: faker.lorem.word(),
      };

      const errorInstance = new errors[name](customValues);

      expect(errorInstance).toStrictEqual(
        expect.objectContaining({
          name,
          ...customValues,
          ...staticValues,
        }),
      );
    });
  });
});
