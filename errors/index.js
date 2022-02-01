import { v4 as uuid } from 'uuid';

class BaseError extends Error {
  constructor({ message, stack, action, statusCode, errorId, requestId, context }) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.action = action;
    this.statusCode = statusCode || 500;
    this.errorId = errorId || uuid();
    this.requestId = requestId;
    this.context = context;
    this.stack = stack;
  }
}

export class InternalServerError extends BaseError {
  constructor({ requestId, errorId, statusCode, stack }) {
    super({
      message: 'Um erro interno não esperado aconteceu.',
      action: "Informe ao suporte o valor encontrado nos campos 'errorId'.",
      statusCode: statusCode || 500,
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
  constructor({ message, stack, context, statusCode }) {
    super({
      message: message,
      action: 'Verifique se os dados enviados ao banco respeitam os tipos e tamanhos das colunas.',
      stack: stack,
      statusCode: statusCode || 503,
      context: context,
    });
  }
}

export class ValidationError extends BaseError {
  constructor({ message, action, stack, statusCode }) {
    super({
      message: message,
      action: action || 'Ajuste os dados enviados e tente novamente.',
      statusCode: statusCode || 400,
      stack: stack,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message, action, stack }) {
    super({
      message: message || 'Usuário não autenticado.',
      action: action || 'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
      statusCode: 401,
      stack: stack,
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor({ message, action, stack }) {
    super({
      message: message || 'Você não possui permissão para executar esta ação.',
      action: action || 'Verifique se você possui permissão para executar esta ação.',
      statusCode: 403,
      stack: stack,
    });
  }
}
