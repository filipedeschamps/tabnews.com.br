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

    if (options.trim) {
      output = trimStart(output);
      output = trimEnd(output);
    }

    if (output.length > options.maxLength) {
      output = trimEnd(output.substring(0, options.maxLength - 3)).concat('...');
    }
  } catch (e) {
    if (options.throwError) {
      logger.error(e);
    }

    return md;
  }
  return output;
}

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
