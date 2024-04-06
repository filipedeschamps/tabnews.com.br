import { createErrorMessage } from 'pages/interface';

describe('createErrorMessage', () => {
  it('should return default error message when responseBody is null', () => {
    const responseBody = null;
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Erro desconhecido. Tente novamente mais tarde.');
  });

  it('should return default error message when responseBody is undefined', () => {
    const responseBody = undefined;
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Erro desconhecido. Tente novamente mais tarde.');
  });

  it('should return error message', () => {
    const responseBody = {
      message: 'Entrada inválida.',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Entrada inválida.');
  });

  it('should return error message with action', () => {
    const responseBody = {
      action: 'Tente novamente.',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Tente novamente.');
  });

  it('should return error message with error_id', () => {
    const responseBody = {
      error_id: '123456789',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Informe ao suporte o valor (123456789)');
  });

  it('should return error message with message and action', () => {
    const responseBody = {
      message: 'Entrada inválida.',
      action: 'Tente novamente.',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Entrada inválida. Tente novamente.');
  });

  it('should return error message without error_id when omitErrorId is true', () => {
    const responseBody = {
      message: 'Entrada inválida.',
      action: 'Tente novamente.',
      error_id: '123456789',
    };
    const errorMessage = createErrorMessage(responseBody, { omitErrorId: true });
    expect(errorMessage).toEqual('Entrada inválida. Tente novamente.');
  });

  it('should return error message with message, action, and error_id', () => {
    const responseBody = {
      message: 'Entrada inválida.',
      action: 'Tente novamente.',
      error_id: '123456789',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Entrada inválida. Tente novamente. Informe ao suporte o valor (123456789)');
  });

  it('should return error message without action when action is a specific string', () => {
    const responseBody = {
      message: 'Um erro interno não esperado aconteceu.',
      action: "Informe ao suporte o valor encontrado no campo 'error_id'.",
      error_id: '123456789',
    };
    const errorMessage = createErrorMessage(responseBody);
    expect(errorMessage).toEqual('Um erro interno não esperado aconteceu. Informe ao suporte o valor (123456789)');
  });
});
