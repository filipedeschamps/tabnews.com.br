import { v4 as uuid } from 'uuid';

class BaseError extends Error {
  constructor({ message, stack, action, statusCode, requestId, errors }) {
    super();
    this.name = this.constructor.name;
    this.stack = stack;
    this.message = message;
    this.action = action;
    this.statusCode = statusCode;
    this.errors = errors;
    this.errorId = uuid();
    this.requestId = requestId;
  }
}

export class InternalServerError extends BaseError {
  constructor({ requestId, stack }) {
    super({
      message: 'Um erro interno não esperado aconteceu.',
      action: "Informe ao suporte o valor encontrado nos campos 'errorId'.",
      statusCode: 500,
      requestId: requestId,
      stack: stack,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ requestId }) {
    super({
      message: 'Não foi possível encontrar este recurso no sistema.',
      action: 'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.',
      statusCode: 404,
      requestId: requestId,
    });
  }
}
