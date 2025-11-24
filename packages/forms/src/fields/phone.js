const relevantCountryCodes = ['1', '55', '351'];

export const phone = {
  value: '',
  label: 'Celular',
  placeholder: 'Informe seu telefone',
  type: 'tel',
  autoComplete: 'tel',
  format: maskPhone,
  prepare: extractPhoneNumber,
  validateOnChange,
  validateOnBlurAndSubmit: validatePhoneObject,
};

export function maskPhone(input) {
  let phone = input.trimStart();

  if (phone.startsWith('+')) {
    phone = '+' + phone.replace(/[^\d()\s-]/g, '');
    phone = phone.replace(/^\+[()\s-]*/g, '+');
  } else {
    phone = phone.replace(/[^\d()\s-]/g, '');
    phone = phone.replace(/^(\d)/, '($1');
  }

  const countryCodesRegex = new RegExp(`^\\+(${relevantCountryCodes.join('|')})(\\(?(\\d))`);
  phone = phone.replace(countryCodesRegex, '+$1($3');

  phone = phone.replace(/(\(\d)(\()(\d+\))/, '$1$3');
  phone = phone.replace(/^(\+55\(\d{2})(\d)/, '$1)$2');
  phone = phone.replace(/^(\(\d{2})(\d)/, '$1)$2');

  let openParenFound = false;
  let closeParenFound = false;

  phone = phone.replace(/([()\s-]+)/g, (match) => {
    if (!openParenFound) {
      openParenFound = true;
      return '(';
    }

    if (!closeParenFound) {
      closeParenFound = true;
      return ')';
    }

    if (match.includes('-') || match.includes(' ')) {
      return '-';
    }

    return '';
  });

  if (phone.length > 3 && !openParenFound) {
    phone = phone.replace(/^\+(\d{2})(\d)(\d+)/, `+$1$2($3`);
  }

  return phone;
}

export function extractPhoneNumber(input) {
  let country_code = '55';
  let area_code = '';
  let number = input.replace(/[^\d+()]/g, '');

  const countryMatch = number.match(/^\++(\d{1,})/);
  if (countryMatch) {
    country_code = countryMatch[1];
    number = number.slice(countryMatch[0].length);
  }

  const areaMatch = number.match(/\((\d+)\)/);
  if (areaMatch) {
    area_code = areaMatch[1];
  }

  number = number.replace(/\(\d+\)/, '');

  return {
    area_code,
    country_code,
    number,
  };
}

export function validatePhoneCodes(phoneObject) {
  if (!/^\d{1,}$/.test(phoneObject.area_code)) {
    return 'Código de área inválido. Insira o DDD entre parênteses.';
  }

  return validateCountryCode(phoneObject);
}

export function validateCountryCode(phoneObject) {
  if (!/^\d{1,3}$/.test(phoneObject.country_code)) {
    return 'Utilize o formato +55(DDD)N ou (DDD)N.';
  }

  return null;
}

export function validatePhoneNumber(phoneObject) {
  if (/^\d{6,}$/.test(phoneObject.number)) {
    return null;
  }

  return 'Número muito curto.';
}

export function validateOnChange(input) {
  const phoneObject = extractPhoneNumber(input);

  return validateCountryCode(phoneObject) || validatePhoneLength(phoneObject);
}

export function validatePhoneObject(phoneObject) {
  return validatePhoneCodes(phoneObject) || validatePhoneNumber(phoneObject) || validatePhoneLength(phoneObject);
}

export function validatePhoneLength(phoneObject) {
  const { area_code, country_code, number } = phoneObject;
  const phoneLength = country_code.length + area_code.length + number.length;

  return phoneLength > 15 ? 'Telefone deve ter no máximo 15 dígitos.' : null;
}
