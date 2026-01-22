const invisibleCharRegex = '[\\s\\p{C}\u034f\u17b4\u17b5\u2800\u115f\u1160\u3164\uffa0]';
const trimStartRegex = new RegExp('^' + invisibleCharRegex, 'u');
const trimEndRegex = new RegExp(invisibleCharRegex + '$', 'u');

export function trimStart(str) {
  while (trimStartRegex.test(str)) {
    str = str.replace(trimStartRegex, '');
  }

  return str;
}

export function trimEnd(str) {
  while (trimEndRegex.test(str)) {
    str = str.replace(trimEndRegex, '');
  }

  return str;
}

const ELLIPSIS = '...';
const graphemeSegmenter = new Intl.Segmenter({ granularity: 'grapheme' });

export function truncate(str, maxLength) {
  if (typeof maxLength !== 'number') return str;
  if (typeof str !== 'string') return str;
  if (str.length <= maxLength) return str;
  if (maxLength <= 0) return '';

  const ellipsis = ELLIPSIS.slice(0, maxLength);

  const graphemes = Array.from(graphemeSegmenter.segment(str), (s) => s.segment);
  if (graphemes.length < maxLength) return str;

  return trimEnd(graphemes.slice(0, maxLength - ellipsis.length).join('')) + ellipsis;
}
