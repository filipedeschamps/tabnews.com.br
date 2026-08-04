import mathPlugin from '@bytemd/plugin-math';
import { getProcessor } from 'bytemd';
import { renderToStaticMarkup } from 'react-dom/server';

import { MarkdownViewer, usePlugins } from '../Markdown';
import { strictInlineMathPlugin } from './strict-inline-math';

const falsePositives = {
  'a price with a space': 'entre R$ 3 e R$ 5',
  'a price without a space': 'entre R$3 e R$5',
  'a price with a space only on the first': 'entre R$ 3 e R$5',
  'a price with a space only on the second': 'entre R$3 e R$ 5',
  'a price with a no-break space, as a copy from a website': 'entre R$\u00a03 e R$\u00a05',
  'a price in dollars': 'de $5 para $10',
  'a price in a foreign currency': 'US$ 3 e US$ 5',
  'a decimal price': 'de R$ 1.999,90 para R$ 1.499,90',
  'a price per unit': 'planos de R$29/mês e R$99/mês',
  'a price in a list': '- R$ 10\n- R$ 20',
  'a price with a hyphen between the values': 'saldo de R$3-R$5 hoje',
  'a currency symbol after the value': 'de 10$ para 20$ dólares',
  'a conversion between two currencies': '1$ = R$ 5,20 hoje',
  'a shell variable': 'export PATH=$HOME/bin e $USER',
  'math whose content is padded': 'a fórmula $ x^2 $ com espaço',
};

// Every one of these is where a rule against prices is at risk of rejecting a formula: math glued to
// a number, or padding that no price is written with.
const formulas = {
  'an exponent after a number': 'na ordem de 10$^{-3}$ segundos',
  'a percentage': 'cresceu 50$\\%$ no ano',
  'a subscript after a letter': 'a variável x$_1$ do vetor',
  'a digit after a letter': 'a variável x$2$ do vetor',
  'a decimal after a letter': 'a variável x$2,5$ do vetor',
  'a coefficient before the formula': 'sobram 3$x$ termos',
  'a number right after the formula': 'o valor $n$1 do vetor',
  'an operator between two numbers': 'o dobro 2$\\times$3 disso',
  'a unit after a number': 'a unidade 5$\\mu$m de largura',
  'a degree after a number': 'o ângulo 90$^\\circ$ reto',
  'a coefficient before a formula that begins with a digit': 'o coeficiente 3$2x$ dobrado',
  'a formula of digits after a number': 'a nota 10$100$ pontos',
  'a formula padded by a line ending': 'a fórmula $\nx^2\n$ com quebra',
  'a formula broken across lines': 'uma soma $a +\nb$ quebrada',
};

describe('ui', () => {
  describe('strictInlineMathPlugin', () => {
    it.each(Object.entries(falsePositives))('does not read %s as math', (_, value) => {
      const html = renderMarkdown(value);

      expect(html).not.toContain('math');
      expect(html).not.toContain('katex');
    });

    it.each(Object.entries(formulas))('still reads %s as math', (_, value) => {
      expect(countFormulas(renderMarkdown(value))).toBe(1);
    });

    // The narrowest second rule that still catches every price cannot tell this apart from "R$3 e R$5".
    it('gives up math glued to a word whose content begins with a digit and carries a letter', () => {
      expect(countFormulas(renderMarkdown('a variável x$2x$ do vetor'))).toBe(0);
    });

    it('keeps the emphasis around a price, which the false positive used to swallow', () => {
      const html = renderMarkdown('de **R$ 3** a **R$ 5** por mês');

      expect(html).toContain('<strong>R$ 3</strong>');
      expect(html).toContain('<strong>R$ 5</strong>');
    });

    it('keeps a price as text where math is not rendered, as in the feed', () => {
      const html = renderMarkdown('entre R$ 3 e R$ 5', { shouldRenderMath: false });

      expect(html).toContain('entre R$ 3 e R$ 5');
      expect(html).not.toContain('math');
    });

    it('renders inline math', () => {
      const html = renderMarkdown('a fórmula $x^2$ inline');

      expect(html).toContain('<span class="katex">');
    });

    it('renders inline math with two dollar signs, the way out of the stricter rules', () => {
      const html = renderMarkdown('a fórmula $$ x^2 $$ inline');

      expect(html).toContain('<span class="katex">');
    });

    it('renders display math', () => {
      const html = renderMarkdown('$$\nx^2 + y^2 = z^2\n$$');

      expect(html).toContain('<span class="katex-display">');
    });

    it('renders two formulas of the same paragraph', () => {
      const html = renderMarkdown('a $x$ e a $y$');

      expect(countFormulas(html)).toBe(2);
    });

    it('renders a formula that shares the paragraph with a price', () => {
      const html = renderMarkdown('o preço R$ 3 e a fórmula $x^2$');

      expect(html).toContain('R$ 3');
      expect(countFormulas(html)).toBe(1);
    });

    it('runs after `@bytemd/plugin-math`, whose construct it hardens', () => {
      const value = 'entre R$ 3 e R$ 5';

      expect(process(value, getPlugins())).not.toContain('math');
      expect(process(value, [strictInlineMathPlugin(), mathPlugin()])).toContain('math-inline');
    });
  });
});

function countFormulas(html) {
  return html.match(/<span class="katex">/g)?.length ?? 0;
}

function renderMarkdown(value, props) {
  return renderToStaticMarkup(<MarkdownViewer value={value} {...props} />);
}

function process(value, plugins) {
  return String(getProcessor({ plugins }).processSync(value));
}

function getPlugins() {
  let plugins;

  function Probe() {
    plugins = usePlugins({});

    return null;
  }

  renderToStaticMarkup(<Probe />);

  return plugins.filter(({ remark }) => remark);
}
