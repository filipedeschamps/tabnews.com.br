import removeMarkdown from 'remove-markdown';

import logger from 'infra/logger';

export default function customRemoveMarkdown(md, options = {}) {
  options.oneLine = Object.hasOwn(options, 'oneLine') ? options.oneLine : true;
  options.throwError = Object.hasOwn(options, 'logError') ? options.throwError : true;

  let output = md || '';

  try {
    output = removeMarkdown(md, options);

    if (options.oneLine) {
      output = output.replace(/\s+/g, ' ');
    }

    if (output.length > options.maxLength) {
      output = output
        .substring(0, options.maxLength - 3)
        .trim()
        .concat('...');
    }

    if (options.trim) {
      output = trimStart(output);
      output = trimEnd(output);
    }
  } catch (e) {
    if (options.throwError) {
      logger.error(e);
    }

    return md;
  }
  return output;
}

const whitespaceAndControlCharRegex = /[\s\p{C}\u034f\u17b4\u17b5\u2800\u115f\u1160\u3164\uffa0]/u;

export function trimStart(str) {
  let i = 0;

  while (i < str.length && whitespaceAndControlCharRegex.test(str[i])) {
    i++;
  }

  return str.slice(i);
}

export function trimEnd(str) {
  let i = str.length - 1;

  while (i >= 0 && whitespaceAndControlCharRegex.test(str[i])) {
    i--;
  }

  return str.slice(0, i + 1);
}
