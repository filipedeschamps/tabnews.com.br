const domainsWithTld = {
  bol: 'bol.com.br',
  gmail: 'gmail.com',
  hotmail: 'hotmail.com',
  outlook: 'outlook.com',
  protonmail: 'protonmail.com',
  yahoo: 'yahoo.com',
  zipmail: 'zipmail.com.br',
};

const gmailTypos = [
  'dmail',
  'gail',
  'gamail',
  'gamial',
  'gamil',
  'gemail',
  'ggmail',
  'gil',
  'gimail',
  'gmad',
  'gmai',
  'gmaiil',
  'gmailc',
  'gmaild',
  'gmaile',
  'gmailee',
  'gmailil',
  'gmaill',
  'gmain',
  'gmaio',
  'gmaiq',
  'gmakl',
  'gmal',
  'gmali',
  'gmanil',
  'gmaol',
  'gmaqil',
  'gmaul',
  'gmeil',
  'gmiail',
  'gmial',
  'gmil',
  'gmmail',
  'gmnail',
  'gmol',
  'gmsil',
  'gnail',
  'hmail',
  'mail',
  'mgil',
  'ygmail',
];

const hotmailTypos = [
  'hitmail',
  'htmail',
  'hotnail',
  'hatmail',
  'hotomail',
  'otmail',
  'hoitmail',
  'hoimail',
  'homail',
  'homtail',
  'homtmail',
  'hormail',
  'hotail',
  'hotamail',
  'hotamil',
  'hotmaail',
  'hotmai',
  'hotmaiil',
  'hotmaill',
  'hotmailt',
  'hotmal',
  'hotmial',
  'hotmiail',
  'hotmil',
  'hotmmail',
  'hotmqil',
  'hotmsil',
  'htoamil',
  'htomail',
  'hoymail',
  'hootmail',
  'hotmi',
  'hotma',
  'hotmali',
  'hotrmail',
];

export const domains = {
  bol: domainsWithTld.bol,

  gmail: domainsWithTld.gmail,
  ...Object.fromEntries(gmailTypos.map((typo) => [typo, domainsWithTld.gmail])),

  hotmail: domainsWithTld.hotmail,
  ...Object.fromEntries(hotmailTypos.map((typo) => [typo, domainsWithTld.hotmail])),

  outlook: domainsWithTld.outlook,
  outlok: domainsWithTld.outlook,
  outloo: domainsWithTld.outlook,

  protonmail: domainsWithTld.protonmail,
  protonmil: domainsWithTld.protonmail,
  prontomail: domainsWithTld.protonmail,

  yahoo: domainsWithTld.yahoo,
  yaho: domainsWithTld.yahoo,

  zipmail: domainsWithTld.zipmail,
};

const tlds = new Set([
  // ccTLDs
  'ar',
  'b',
  'br',
  'combr',
  'r',

  // gTLDs
  'com',
  'c',
  'cim',
  'cin',
  'ckm',
  'co',
  'coj',
  'cok',
  'coom',
  'comm',
  'con',
  'cm',
  'cpm',
  'mo',
  'net',
  'ocm',
  'om',
]);

export function suggestEmail(typedEmail) {
  const [userName, domainWithTld] = typedEmail.split('@');

  if (!domainWithTld) return null;

  let domain = domainWithTld
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.');

  if (domainWithTld.toLowerCase() === 'yahoo.com.br' || domainWithTld.toLowerCase() === 'outlook.com.br') {
    return null;
  }

  if (domain.startsWith('yahoo.com.')) {
    return `${userName}@yahoo.com.br`.toLowerCase();
  }

  if (domain.startsWith('outlook.com.')) {
    return `${userName}@outlook.com.br`.toLowerCase();
  }

  while (tlds.has(domain.slice(domain.lastIndexOf('.') + 1))) {
    domain = domain.slice(0, domain.lastIndexOf('.'));
  }

  const suggestedEmail = `${userName}@${domains[domain] || domainWithTld}`.toLowerCase();

  if (suggestedEmail === typedEmail.toLowerCase()) return null;

  return suggestedEmail;
}

export function isValidEmail(email) {
  return /^[^\s@]+@([\p{L}\d_]+[.-])*([\p{L}\d_]{1,255}[.])[-a-z0-9]{2,24}$/u.test(email);
}
