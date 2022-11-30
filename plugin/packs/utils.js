import * as Options from '@constants/options';

export function getOptionValue(key, value) {
  const options = Options.options[0];
  if (value && options[key]) {
    const item = options[key].find((element) => element.text === value);
    return (item && item.value) || '';
  }
  return '';
}

export function suggestEmail(typedEmail) {
  const userName = typedEmail.split('@')[0];
  const typedDomain = typedEmail.split('@')[1];

  const rightDomain = getOptionValue('email_domains', typedDomain);
  if (!rightDomain) return false;

  return `${userName}@${rightDomain}`;
}
