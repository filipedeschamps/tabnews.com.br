import { v4 as uuid } from 'uuid';

class BaseError extends Error {
  constructor({ message, stack, action, statusCode, errorId, requestId, errors }) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.action = action;
    this.statusCode = statusCode;
    this.errorId = errorId || uuid();
    this.requestId = requestId;
    this.stack = stack;
  }
}

export class InternalServerError extends BaseError {
  constructor({ requestId, errorId, stack }) {
    super({
      message: 'Um erro interno não esperado aconteceu.',
      action: "Informe ao suporte o valor encontrado nos campos 'errorId'.",
      statusCode: 500,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ message, action, requestId, errorId, stack }) {
    super({
      message: message || 'Não foi possível encontrar este recurso no sistema.',
      action: action || 'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.',
      statusCode: 404,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
    });
  }
}
export class DatabaseError extends BaseError {
  constructor({ message, stack }) {
    super({
      message: message,
      action: 'Verifique se os dados enviados ao banco respeitam os tipos e tamanhos das colunas.',
      stack: stack,
    });
  }
}
export class ValidationError extends BaseError {
  constructor({ message, stack, statusCode }) {
    super({
      message: message,
      action: 'Ajuste os dados enviados e tente novamente.',
      statusCode: statusCode || 400,
      stack: stack,
    });
  }
}
