export const number = {
  value: '',
  label: 'Número',
  placeholder: '000',
  inputMode: 'numeric',
  autoComplete: 'address-line1',
  format: (number) => number.replace(/\D/g, ''),
  validateOnBlurAndSubmit: (number) => (number.length ? null : 'Informe o número.'),
};
