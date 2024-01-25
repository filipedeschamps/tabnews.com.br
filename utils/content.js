export function isContentTooShort(content, minimumNumWords) {
  const regexPattern = new RegExp(`[a-záéíóúâôãõç]{${minimumNumWords},}`, 'gi');
  const matches = content.normalize('NFC').match(regexPattern);

  if (!matches) return true;

  return matches.length < minimumNumWords;
}
