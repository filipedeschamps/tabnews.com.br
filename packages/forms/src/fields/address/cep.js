const addressApiUrl = 'https://brasilapi.com.br/api/cep/v1/';
let abortController = null;

export const cep = {
  label: 'CEP',
  value: '',
  maxLength: 10, // to work autofill with 12.456-890
  placeholder: '00000-000',
  inputMode: 'numeric',
  autoComplete: 'postal-code',
  format,
  prepare,
  validateOnBlurAndSubmit,
  onValidChange,
};

export function validateOnBlurAndSubmit(value) {
  if (!value) return 'CEP inválido';
  if (value.length < 8) return 'CEP incompleto';
  if (value.length > 8) return 'CEP inválido';
  return null;
}

export async function onValidChange({ value, updateState }) {
  if (value.length < 9) return;

  updateState({ cep: { loading: true } });

  const address = { cep: { value, loading: false } };

  const apiAddress = await getAddress(value);

  if (apiAddress) {
    address.state = { value: apiAddress.state, error: null, isValid: !!apiAddress.state };
    address.city = { value: apiAddress.city, error: null, isValid: !!apiAddress.city };
    address.neighborhood = { value: apiAddress.neighborhood, error: null, isValid: !!apiAddress.neighborhood };
    address.street = { value: apiAddress.street, error: null, isValid: !!apiAddress.street };
    address.cep.error = null;
    address.cep.isValid = true;
  }

  updateState(address);

  return address;
}

export async function getAddress(cep) {
  if (abortController) abortController.abort();
  abortController = new AbortController();

  const cleanedCep = prepare(cep);

  try {
    const response = await fetch(`${addressApiUrl}${cleanedCep}`, { signal: abortController.signal });

    if (response.status === 404) {
      throw new Error('CEP não encontrado.');
    }

    if (!response.ok && response.status !== 400) {
      throw new Error('Resposta inválida.');
    }

    const address = await response.json();

    if (address.cep === cleanedCep) {
      return address;
    }

    if (address.message) {
      throw new Error(address.message);
    }

    throw new Error('Dados inválidos.');
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn('Falha ao obter dados do CEP', cep, '- Erro:', err.message);
  }
}

export function format(value) {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d{1,3})/, '$1-$2');
}

export function prepare(value) {
  return value.replace(/\D/g, '');
}
