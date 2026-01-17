export const cardNumber = {
  value: '',
  label: 'Número do cartão',
  placeholder: '0000 0000 0000 0000',
  inputMode: 'numeric',
  autoComplete: 'cc-number',
  format: (number) =>
    number
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim()
      .slice(0, 23),
  prepare: (number) => number.replace(/\D/g, ''),
  validateOnBlurAndSubmit: (number) => (/^\d{13,19}$/.test(number) ? null : 'Cartão inválido.'),
};

export const holderName = {
  value: '',
  label: 'Nome do titular',
  placeholder: 'Informe o nome impresso no cartão',
  autoComplete: 'cc-name',
  format: (name) => name.toUpperCase(),
  prepare: (name) => name.trim().toUpperCase(),
  validateOnBlurAndSubmit: (name) =>
    name.length < 2 || name.length > 50 ? 'Nome do titular precisa ter entre 2 e 50 caracteres.' : null,
};

export const month = {
  value: '',
  label: 'Mês',
  autoComplete: 'cc-exp-month',
  options: [
    { value: '', label: 'MM', disabled: true },
    { value: '01', label: '01' },
    { value: '02', label: '02' },
    { value: '03', label: '03' },
    { value: '04', label: '04' },
    { value: '05', label: '05' },
    { value: '06', label: '06' },
    { value: '07', label: '07' },
    { value: '08', label: '08' },
    { value: '09', label: '09' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
  ],
  onValidChange: ({ month, updateFields }) => updateFields({ month: { isValid: !!month } }),
  validateOnBlurAndSubmit: (month) => (month === '' ? 'Selecione.' : null),
};

export const year = {
  value: '',
  label: 'Ano',
  autoComplete: 'cc-exp-year',
  options: getYears(),
  onValidChange: ({ year, updateFields }) => updateFields({ year: { isValid: !!year } }),
  validateOnBlurAndSubmit: (year) => (year === '' ? 'Selecione.' : null),
};

export const cvv = {
  value: '',
  label: 'CVV',
  placeholder: '000',
  inputMode: 'numeric',
  autoComplete: 'off',
  format: (cvv) => cvv.replace(/\D/g, '').slice(0, 4),
  validateOnBlurAndSubmit: (cvv) => (/^\d{3,4}$/.test(cvv) ? null : 'CVV inválido.'),
};

function getYears(numberOfYears = 35) {
  const currentYear = new Date().getFullYear() % 100;
  const years = Array.from({ length: numberOfYears }, (_, index) => {
    const year = (currentYear + index) % 100;
    const formattedYear = year.toString().padStart(2, '0');

    return {
      value: formattedYear,
      label: formattedYear,
    };
  });

  years.unshift({ value: '', label: 'AA', disabled: true });

  return years;
}

export const card = {
  cardNumber,
  holderName,
  month,
  year,
  cvv,
};
