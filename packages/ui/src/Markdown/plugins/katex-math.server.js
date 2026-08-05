import katex from 'katex';

export const canRenderMath = true;

export function renderMath(tex, { displayMode, katexOptions }) {
  // `strict: 'ignore'` renders exactly like the default `'warn'`, minus the `console.warn` any
  // reader could trigger on the server. The client keeps warning, which is where it helps.
  const value = katex.renderToString(tex, {
    ...katexOptions,
    displayMode,
    strict: 'ignore',
    throwOnError: false,
  });

  return [{ type: 'raw', value }];
}
