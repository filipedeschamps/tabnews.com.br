export default function createErrorMessage(responseBody, { omitErrorId = false } = {}) {
  const { message, action, error_id } = responseBody || {};
  const errorMessages = [];

  if (message) {
    errorMessages.push(message);
  }

  if (action && action !== "Informe ao suporte o valor encontrado no campo 'error_id'.") {
    errorMessages.push(action);
  }

  if (error_id && !omitErrorId) {
    errorMessages.push(`Informe ao suporte o valor (${error_id})`);
  }

  return errorMessages.join(' ') || 'Erro desconhecido. Tente novamente mais tarde.';
}
