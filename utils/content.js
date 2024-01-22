export function isContentTooShort(content) {
  const minimumNumLettersPerWord = 5;
  const minimumNumWords = 5;

  const regexPattern = new RegExp(`[a-záéíóúâôãõç]{${minimumNumLettersPerWord},}`, 'gi');
  const matches = content.normalize('NFC').match(regexPattern);

  return !matches || matches.length < minimumNumWords;
}
