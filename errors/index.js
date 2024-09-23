class BaseError extends Error {
  constructor({
    name,
    message,
    action,
    statusCode = 500,
    errorId = crypto.randomUUID(),
    requestId,
    context,
    stack,
    errorLocationCode,
    key,
    type,
    databaseErrorCode,
  }) {
    super(message);
    this.name = name;
    this.action = action;
    this.statusCode = statusCode;
    this.errorId = errorId;
    this.requestId = requestId;
    this.context = context;
    this.stack = stack;
    this.errorLocationCode = errorLocationCode;
    this.key = key;
    this.type = type;
    this.databaseErrorCode = databaseErrorCode;
  }
}

const createErrorConstructor = (name, defaultMessage, defaultAction, statusCode) => {
  return class extends BaseError {
    constructor({ message = defaultMessage, action = defaultAction, ...rest }) {
      super({ name, message, action, statusCode, ...rest });
    }
  };
};

export const InternalServerError = createErrorConstructor(
  'InternalServerError',
  'Um erro interno não esperado aconteceu.',
  "Informe ao suporte o valor encontrado no campo 'error_id'.",
  500,
);

export const NotFoundError = createErrorConstructor(
  'NotFoundError',
  'Não foi possível encontrar este recurso no sistema.',
  'Verifique se o caminho (PATH) está correto.',
  404,
);

export const ServiceError = createErrorConstructor(
  'ServiceError',
  'Serviço indisponível no momento.',
  'Verifique se o serviço está disponível.',
  503,
);

export const ValidationError = createErrorConstructor(
  'ValidationError',
  'Um erro de validação ocorreu.',
  'Ajuste os dados enviados e tente novamente.',
  400,
);

export const UnauthorizedError = createErrorConstructor(
  'UnauthorizedError',
  'Usuário não autenticado.',
  'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
  401,
);

export const ForbiddenError = createErrorConstructor(
  'ForbiddenError',
  'Você não possui permissão para executar esta ação.',
  'Verifique se você possui permissão para executar esta ação.',
  403,
);

export const TooManyRequestsError = createErrorConstructor(
  'TooManyRequestsError',
  'Você realizou muitas requisições recentemente.',
  'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
  429,
);

export const UnprocessableEntityError = createErrorConstructor(
  'UnprocessableEntityError',
  'Não foi possível realizar esta operação.',
  'Os dados enviados estão corretos, porém não foi possível realizar esta operação.',
  422,
);

export const MethodNotAllowedError = createErrorConstructor(
  'MethodNotAllowedError',
  'Método não permitido para este recurso.',
  'Verifique se o método HTTP utilizado é válido para este recurso.',
  405,
);
