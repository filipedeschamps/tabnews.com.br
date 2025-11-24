export const complement = {
  value: '',
  label: 'Complemento (opcional)',
  placeholder: 'Apartamento / Bloco / Fundos',
  autoComplete: 'address-line2',
  prepare: (complement) => complement.trim(),
};
