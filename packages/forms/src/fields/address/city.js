export const city = {
  value: '',
  label: 'Cidade',
  placeholder: 'Onde você mora?',
  autoComplete: 'address-level2',
  autoCapitalize: 'words',
  prepare: (city) => city.trim(),
  validateOnBlurAndSubmit: (city) => (city.length ? null : 'Informe sua cidade.'),
};
