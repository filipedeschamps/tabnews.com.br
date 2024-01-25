export function isContentTooShort(content, numCharacters) {
  const regexPattern = new RegExp(`[a-záéíóúâôãõç]{${numCharacters},}`, 'gi');
  const matches = content.normalize('NFC').match(regexPattern);
  return matches && matches.length < numCharacters;
}
