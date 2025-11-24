export const street = {
  value: '',
  label: 'Endereço',
  autoComplete: 'street-address',
  placeholder: 'Rua / Avenida / Praça',
  prepare: (street) => street.trim(),
  validateOnBlurAndSubmit: (street) => (street.length ? null : 'Informe um endereço válido.'),
};
