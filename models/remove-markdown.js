import { trimEnd, trimStart, truncate } from '@tabnews/helpers';
import removeMarkdown from 'remove-markdown';

import logger from 'infra/logger';

export default function customRemoveMarkdown(md, options = {}) {
  options.oneLine = Object.hasOwn(options, 'oneLine') ? options.oneLine : true;
  options.throwError = Object.hasOwn(options, 'logError') ? options.throwError : true;
  options.trim = Object.hasOwn(options, 'trim') ? options.trim : true;

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

    output = truncate(output, options.maxLength);
  } catch (e) {
    if (options.throwError) {
      logger.error(e);
    }

    return md;
  }
  return output;
}
