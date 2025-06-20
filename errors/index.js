class BaseError extends Error {
  constructor({
    name,
    message,
    stack,
    cause,
    action,
    statusCode,
    errorId,
    requestId,
    context,
    errorLocationCode,
    key,
    type,
    databaseErrorCode,
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
    this.action = action;
    this.statusCode = statusCode || 500;
    this.errorId = errorId || crypto.randomUUID();
    this.requestId = requestId;
    this.context = context;
    this.stack = stack;
    this.errorLocationCode = errorLocationCode;
    this.key = key;
    this.type = type;
    this.databaseErrorCode = databaseErrorCode;
  }
}

export class InternalServerError extends BaseError {
  constructor({ message, action, requestId, errorId, statusCode, stack, errorLocationCode }) {
    super({
      name: 'InternalServerError',
      message: message || 'Um erro interno não esperado aconteceu.',
      action: action || "Informe ao suporte o valor encontrado no campo 'error_id'.",
      statusCode: statusCode || 500,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor({ message, action, requestId, errorId, stack, errorLocationCode, key }) {
    super({
      name: 'NotFoundError',
      message: message || 'Não foi possível encontrar este recurso no sistema.',
      action: action || 'Verifique se o caminho (PATH) está correto.',
      statusCode: 404,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
      errorLocationCode: errorLocationCode,
      key: key,
    });
  }
}

export class ServiceError extends BaseError {
  constructor({ message, action, stack, context, statusCode, errorLocationCode, databaseErrorCode, cause }) {
    super({
      name: 'ServiceError',
      message: message || 'Serviço indisponível no momento.',
      action: action || 'Verifique se o serviço está disponível.',
      stack: stack,
      cause: cause,
      statusCode: statusCode || 503,
      context: context,
      errorLocationCode: errorLocationCode,
      databaseErrorCode: databaseErrorCode,
    });
  }
}

export class ValidationError extends BaseError {
  constructor({ message, action, stack, statusCode, context, errorLocationCode, key, type }) {
    super({
      name: 'ValidationError',
      message: message || 'Um erro de validação ocorreu.',
      action: action || 'Ajuste os dados enviados e tente novamente.',
      statusCode: statusCode || 400,
      stack: stack,
      context: context,
      errorLocationCode: errorLocationCode,
      key: key,
      type: type,
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message, action, requestId, stack, errorLocationCode }) {
    super({
      name: 'UnauthorizedError',
      message: message || 'Usuário não autenticado.',
      action: action || 'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
      requestId: requestId,
      statusCode: 401,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor({ message, action, requestId, stack, errorLocationCode }) {
    super({
      name: 'ForbiddenError',
      message: message || 'Você não possui permissão para executar esta ação.',
      action: action || 'Verifique se você possui permissão para executar esta ação.',
      requestId: requestId,
      statusCode: 403,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}

export class TooManyRequestsError extends BaseError {
  constructor({ message, action, context, stack, errorLocationCode }) {
    super({
      name: 'TooManyRequestsError',
      message: message || 'Você realizou muitas requisições recentemente.',
      action: action || 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
      statusCode: 429,
      context: context,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}

export class UnprocessableEntityError extends BaseError {
  constructor({ message, action, stack, errorLocationCode }) {
    super({
      name: 'UnprocessableEntityError',
      message: message || 'Não foi possível realizar esta operação.',
      action: action || 'Os dados enviados estão corretos, porém não foi possível realizar esta operação.',
      statusCode: 422,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}

export class MethodNotAllowedError extends BaseError {
  constructor({ message, action, requestId, errorId, stack, errorLocationCode }) {
    super({
      name: 'MethodNotAllowedError',
      message: message || 'Método não permitido para este recurso.',
      action: action || 'Verifique se o método HTTP utilizado é válido para este recurso.',
      statusCode: 405,
      requestId: requestId,
      errorId: errorId,
      stack: stack,
      errorLocationCode: errorLocationCode,
    });
  }
}
