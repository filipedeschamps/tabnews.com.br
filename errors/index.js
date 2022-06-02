import { v4 as uuid } from 'uuid';

class BaseError extends Error {
  constructor({
    message,
    stack,
    action,
    statusCode,
    errorId,
    requestId,
    context,
    errorUniqueCode,
    key,
    type,
    databaseErrorCode,
  }) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.action = action;
    this.statusCode = statusCode || 500;
    this.errorId = errorId || uuid();
    this.requestId = requestId;
    this.context = context;
    this.stack = stack;
    this.errorUniqueCode = errorUniqueCode;
    this.key = key;
    this.type = type;
    this.databaseErrorCode = databaseErrorCode;
  }
}

export class InternalServerError extends BaseError {
  constructor({ message, action, requestId, errorId, statusCode, stack, errorUniqueCode }) {
    super({
      message: message || 'Um erro interno não esperado aconteceu.',
      action: action || "Informe ao suporte o valor encontrado no campo 'error_id'.",
      statusCode: statusCode || 500,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
      errorUniqueCode: errorUniqueCode,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ message, action, requestId, errorId, stack, errorUniqueCode, key }) {
    super({
      message: message || 'Não foi possível encontrar este recurso no sistema.',
      action: action || 'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.',
      statusCode: 404,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
      errorUniqueCode: errorUniqueCode,
      key: key,
    });
  }
}

export class ServiceError extends BaseError {
  constructor({ message, action, stack, context, statusCode, errorUniqueCode, databaseErrorCode }) {
    super({
      message: message || 'Serviço indisponível no momento.',
      action: action || 'Verifique se o serviço está disponível.',
      stack: stack,
      statusCode: statusCode || 503,
      context: context,
      errorUniqueCode: errorUniqueCode,
      databaseErrorCode: databaseErrorCode,
    });
  }
}

export class ValidationError extends BaseError {
  constructor({ message, action, stack, statusCode, context, errorUniqueCode, key, type }) {
    super({
      message: message || 'Um erro de validação ocorreu.',
      action: action || 'Ajuste os dados enviados e tente novamente.',
      statusCode: statusCode || 400,
      stack: stack,
      context: context,
      errorUniqueCode: errorUniqueCode,
      key: key,
      type: type,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message, action, stack, errorUniqueCode }) {
    super({
      message: message || 'Usuário não autenticado.',
      action: action || 'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
      statusCode: 401,
      stack: stack,
      errorUniqueCode: errorUniqueCode,
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor({ message, action, stack, errorUniqueCode }) {
    super({
      message: message || 'Você não possui permissão para executar esta ação.',
      action: action || 'Verifique se você possui permissão para executar esta ação.',
      statusCode: 403,
      stack: stack,
      errorUniqueCode: errorUniqueCode,
    });
  }
}
