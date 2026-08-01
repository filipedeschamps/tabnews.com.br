import { version as installedKatexVersion } from 'katex/package.json';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';

import { MarkdownViewer } from '../Markdown';
import { DEFAULT_STYLESHEET, KATEX_VERSION } from './katex-stylesheet';

const installedStylesheetFile = createRequire(import.meta.url).resolve('katex/dist/katex.min.css');

describe('ui', () => {
  describe('katexStylesheetPlugin', () => {
    it('loads the stylesheet on the server for inline math', () => {
      const html = renderSSR('Um $x^2$ inline');

      expect(html).toContain('katex.min.css');
      expect(html).toContain('rel="stylesheet"');
      expect(html).toContain('crossorigin=""');
      expect(html).toContain('integrity="sha384-');
    });

    it('loads the stylesheet on the server for display math', () => {
      const html = renderSSR('$$\n\\begin{array}{r}\n  1010 \\\\\n+ 0011\n\\end{array}\n$$');

      expect(html).toContain('katex.min.css');
    });

    it('loads the stylesheet only once for content with several formulas', () => {
      const html = renderSSR('$x^2$ e $y^2$\n\n$$z^2$$');

      expect(html.match(/katex\.min\.css/g)).toHaveLength(1);
    });

    it('does not load the stylesheet for content without math', () => {
      const html = renderSSR('Custa 5 reais\n\n```shell\necho $PATH # custa $5\n```');

      expect(html).not.toContain('katex');
    });

    it('pins the default stylesheet to the installed katex version', () => {
      expect(KATEX_VERSION).toBe(installedKatexVersion);
      expect(renderSSR('Um $x^2$ inline')).toContain(`katex@${installedKatexVersion}/`);
    });

    it('pins the default integrity to the installed stylesheet', () => {
      const digest = createHash('sha384').update(readFileSync(installedStylesheetFile)).digest('base64');

      expect(DEFAULT_STYLESHEET.integrity).toBe(`sha384-${digest}`);
    });

    it('loads a custom stylesheet without subresource integrity', () => {
      const html = renderSSR('Um $x^2$ inline', { katexStylesheetHref: '/katex/1.2.3/katex.min.css' });

      expect(html).toContain('href="/katex/1.2.3/katex.min.css"');
      expect(html).toContain('rel="stylesheet"');
      expect(html).not.toContain('cdn.jsdelivr.net');
      expect(html).not.toContain('integrity');
      expect(html).not.toContain('crossorigin');
    });

    it('does not load a custom stylesheet for content without math', () => {
      const html = renderSSR('Sem matemática', { katexStylesheetHref: '/katex/1.2.3/katex.min.css' });

      expect(html).not.toContain('katex');
    });
  });
});

function renderSSR(value, props) {
  return renderToStaticMarkup(<MarkdownViewer value={value} {...props} />);
}
