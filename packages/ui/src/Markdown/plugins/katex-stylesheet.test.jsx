import { renderToStaticMarkup } from 'react-dom/server';

import { MarkdownViewer } from '../Markdown';

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
  });
});

function renderSSR(value) {
  return renderToStaticMarkup(<MarkdownViewer value={value} />);
}
