export const neighborhood = {
  value: '',
  label: 'Bairro',
  placeholder: 'Qual é o seu bairro?',
  autoComplete: 'address-level3',
  prepare: (neighborhood) => neighborhood.trim(),
  validateOnBlurAndSubmit: (neighborhood) => (neighborhood.length ? null : 'Informe seu bairro.'),
};
