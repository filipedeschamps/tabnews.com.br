/* eslint-disable no-console */
export const done = (...message) => {
  console.info('\x1b[32m%s\x1b[0m', '✔', ...message);
};

export const error = (...message) => {
  console.error('\x1b[31m%s\x1b[0m', '✖', message.join(' '));
};

export const info = (...message) => {
  console.info(...message);
};

export const warning = (...message) => {
  console.warn('\x1b[33m%s\x1b[0m\x1b[1m%s\x1b[0m', '⚠️ ', message.join(' '));
};
