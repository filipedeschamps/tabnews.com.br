import mathPlugin from '@bytemd/plugin-math';
import { getProcessor } from 'bytemd';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

import { MarkdownViewer, usePlugins } from '../Markdown';
import { katexMathPlugin, katexRawGuardPlugin } from './katex-math';

// One goes on the root and the other nested, since the guard has to reach the whole tree.
const injectedRaw = ['<script>alert(1)</script>', '<img src=x onerror="alert(1)">'];

const rawInjector = {
  rehype: (processor) =>
    processor.use(() => (tree) => {
      tree.children.push({ type: 'raw', value: injectedRaw[0] });
      tree.children.find(({ children }) => children)?.children.push({ type: 'raw', value: injectedRaw[1] });
    }),
};

function expectInjectedRawEscaped(html) {
  expect(html).not.toContain('<script');
  expect(html).not.toContain('<img');

  injectedRaw.forEach((value) => expect(html).toContain(value.replaceAll('<', '&#x3C;')));
}

describe('ui', () => {
  afterEach(() => {
    vi.doUnmock('./katex-math.server');
    vi.resetModules();
  });

  describe('katexMathPlugin', () => {
    it('renders inline math on the server', () => {
      const html = renderSSR('Um $x^2$ inline');

      expect(html).toContain('<span class="katex">');
      expect(html).not.toContain('$x^2$');
    });

    it('renders display math on the server', () => {
      const html = renderSSR('$$\nx^2 + y^2 = z^2\n$$');

      expect(html).toContain('<span class="katex-display">');
    });

    it('drops the "math" class name, which the client uses to rerender over the markup', () => {
      const html = renderSSR('$x^2$ e\n\n$$\ny^2\n$$');

      expect(html).toContain('class="math-inline"');
      expect(html).toContain('class="math-display"');
      expect(html).not.toContain('math math-inline');
      expect(html).not.toContain('math math-display');
    });

    it('renders the MathML copy, which is the only part a screen reader reads', () => {
      const html = renderSSR('Um $x^2$ inline');

      expect(html).toContain('<span class="katex-mathml">');
      expect(html).toContain('<annotation encoding="application/x-tex">x^2</annotation>');
      expect(html).toContain('<span class="katex-html" aria-hidden="true">');
    });

    it('renders invalid math as text instead of throwing', () => {
      const html = renderSSR('Um $\\frac{1}{$ quebrado');

      expect(html).toContain('katex-error');
    });

    it('leaves the raw TeX, and no stylesheet, when `shouldRenderMath` is false, as on the RSS feed', () => {
      const html = renderSSR('Um $x^2$ inline', { shouldRenderMath: false });

      expect(html).toContain('<span class="math math-inline">x^2</span>');
      expect(html).not.toContain('katex');
    });

    it('leaves content without math untouched', () => {
      const html = renderSSR('Custa 5 reais');

      expect(html).not.toContain('katex');
    });
  });

  describe('katexMathPlugin, sanitization', () => {
    const payloads = {
      'a script tag': '<script>alert(1)</script>',
      'an inline event handler': '<img src=x onerror="alert(1)">',
      'an iframe': '<iframe src="https://evil.com"></iframe>',
      'a handler on a block element': '<div onclick="alert(1)">clique</div>',
      'a javascript: link': '[link](javascript:alert(1))',
      'HTML inside a formula': String.raw`$\text{<img src=x onerror=alert(1)>}$`,
      'a javascript: URL through \\href': String.raw`$\href{javascript:alert(1)}{x}$`,
      'markup through \\htmlClass': String.raw`$\htmlClass{<img src=x onerror=alert(1)>}{x}$`,
    };

    it.each(Object.entries(payloads))('drops %s', (_, payload) => {
      const html = renderSSR(`Uma fórmula $x^2$ e ${payload}`);
      const document = new DOMParser().parseFromString(html, 'text/html');
      const elements = [...document.querySelectorAll('*')];

      expect(html).toContain('<span class="katex">');
      expect(document.querySelector('script, iframe, object, embed')).toBeNull();
      expect(
        elements.filter((element) => element.getAttributeNames().some((name) => name.startsWith('on'))),
      ).toStrictEqual([]);
      expect(elements.filter((element) => /javascript:/i.test(element.outerHTML.split('>')[0]))).toStrictEqual([]);
    });

    it('renders the author HTML exactly as the whole pipeline without the plugin does', async () => {
      const payload = Object.values(payloads)
        .filter((value) => !value.includes('$'))
        .join('\n\n');
      const props = { clobberPrefix: 'rafael-content-' };
      const withPlugin = renderSSR(payload, props);

      vi.doMock('./katex-math.server', () => import('./katex-math.browser'));
      vi.resetModules();

      const { MarkdownViewer: WithoutPlugin } = await import('../Markdown');

      expect(withPlugin).toBe(renderToStaticMarkup(<WithoutPlugin value={payload} {...props} />));
    });

    it('is the last plugin of the viewer, so that nothing can emit a raw node after it', () => {
      const html = process('Uma fórmula $x^2$', getPlugins().toSpliced(-1, 0, rawInjector));

      expect(html).toContain('<span class="katex">');
      expectInjectedRawEscaped(html);
    });

    it('escapes a raw node created by a plugin that runs after it', () => {
      const plugins = [mathPlugin(), katexMathPlugin(), rawInjector, katexRawGuardPlugin()];
      const html = process('Uma fórmula $x^2$', plugins);

      expect(html).toContain('<span class="katex">');
      expectInjectedRawEscaped(html);
    });

    it('escapes it on a content without math, where this plugin renders nothing', () => {
      const plugins = [mathPlugin(), katexMathPlugin(), rawInjector, katexRawGuardPlugin()];
      const html = process('Custa 5 reais', plugins);

      expect(html).not.toContain('katex');
      expectInjectedRawEscaped(html);
    });
  });

  describe('katexMathPlugin, on the client', () => {
    it('is replaced by the stub through the `browser` field, so that katex stays out of the bundle', async () => {
      const packageRoot = resolve(import.meta.dirname, '../../..');
      const packageJson = JSON.parse(readFileSync(resolve(packageRoot, 'package.json')));
      const entries = Object.entries(packageJson.browser);

      expect(entries).toHaveLength(1);

      const [[serverPath, browserPath]] = entries;

      expect(serverPath).toMatch(/katex-math\.server\.js$/);
      expect(browserPath).toMatch(/katex-math\.browser\.js$/);
      expect(existsSync(resolve(packageRoot, serverPath))).toBe(true);
      expect(existsSync(resolve(packageRoot, browserPath))).toBe(true);

      const server = await import('./katex-math.server');
      const browser = await import('./katex-math.browser');

      expect(Object.keys(browser)).toStrictEqual(Object.keys(server));
      expect(browser.canRenderMath).toBe(false);
      expect(browser.renderMath()).toBeNull();
    });
  });
});

function renderSSR(value, props) {
  return renderToStaticMarkup(<MarkdownViewer value={value} {...props} />);
}

function process(value, plugins) {
  return String(getProcessor({ plugins }).processSync(value));
}

function getPlugins(options) {
  let plugins;

  function Probe() {
    plugins = usePlugins({ ...options });

    return null;
  }

  renderToStaticMarkup(<Probe />);

  return plugins;
}
