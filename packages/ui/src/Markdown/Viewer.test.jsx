import { ThemeProvider } from '@primer/react';
import { userEvent } from '@testing-library/user-event';
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

import { MarkdownViewer } from './Markdown';

const value = 'Um $x^2$ inline';
const valueWithDiagram = `${value}\n\n\`\`\`mermaid\ngraph TD\nA-->B\n\`\`\``;

// Stands in for `mermaidPlugin`, which collects its code blocks synchronously and only replaces
// them after awaiting the `mermaid` import.
const diagramRuns = [];

function mockMermaidPlugin() {
  vi.doMock('./plugins/mermaid', () => ({
    mermaidPlugin: ({ theme }) => ({
      viewerEffect({ markdownBody }) {
        const elements = markdownBody.querySelectorAll('pre>code.language-mermaid');

        diagramRuns.push(theme);

        Promise.resolve().then(() => {
          elements.forEach((element) => {
            const diagram = document.createElement('div');

            diagram.className = 'bytemd-mermaid';
            diagram.textContent = `diagram-${theme}`;
            element.parentElement.replaceWith(diagram);
          });
        });
      },
    }),
  }));
}

describe('ui', () => {
  describe('Viewer', () => {
    beforeAll(() => {
      // `@bytemd/plugin-math` reads the formula from `innerText`, which jsdom does not implement.
      Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() {
          return this.textContent;
        },
      });
    });

    beforeEach(() => {
      diagramRuns.length = 0;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.doUnmock('./plugins/katex-math.server');
      vi.doUnmock('./plugins/mermaid');
      vi.resetModules();
    });

    it('keeps the math rendered by the server through hydration, without warning', async () => {
      const container = mountServerHTML(value);
      const errors = spyOnConsoleError();
      const { ClientMarkdownViewer } = await importAsClient();

      await act(() => {
        hydrateRoot(container, <ClientMarkdownViewer value={value} />);
      });

      expect(container.querySelector('.katex')).not.toBeNull();
      expect(visibleText(container)).not.toContain('x^2');
      expect(errors.filter((error) => /hydrat/i.test(error))).toStrictEqual([]);
    });

    it('keeps the math when the parent rerenders', async () => {
      const container = mountServerHTML(value);
      const { ClientMarkdownViewer } = await importAsClient();
      let root;

      await act(() => {
        root = hydrateRoot(container, <ClientMarkdownViewer value={value} />);
      });

      const mutations = [];
      new MutationObserver((records) => mutations.push(...records)).observe(container, {
        childList: true,
        subtree: true,
      });

      await act(() => {
        root.render(<ClientMarkdownViewer value={value} />);
      });

      expect(container.querySelector('.katex')).not.toBeNull();
      expect(visibleText(container)).not.toContain('x^2');
      expect(
        mutations.filter((mutation) => [...mutation.addedNodes].some((node) => node.textContent === value)),
      ).toStrictEqual([]);
    });

    it('lets a plugin that renders asynchronously finish over the markup on screen', async () => {
      mockMermaidPlugin();

      const container = mountServerHTML(valueWithDiagram);
      const { ClientMarkdownViewer } = await importAsClient();

      await act(() => {
        hydrateRoot(container, <ClientMarkdownViewer value={valueWithDiagram} />);
      });

      expect(container.querySelector('.bytemd-mermaid')).not.toBeNull();
      expect(container.querySelector('code.language-mermaid')).toBeNull();
      expect(diagramRuns).toStrictEqual(['default']);
    });

    it('rewrites the markup when the value changes, as in the editor', async () => {
      mockMermaidPlugin();

      const container = mountServerHTML(value);
      const { ClientMarkdownViewer } = await importAsClient();
      let root;

      await act(() => {
        root = hydrateRoot(container, <ClientMarkdownViewer value={value} />);
      });

      await act(() => {
        root.render(<ClientMarkdownViewer value={valueWithDiagram} />);
      });

      expect(container.querySelector('.bytemd-mermaid')).not.toBeNull();
      expect(diagramRuns).toStrictEqual(['default', 'default']);
      // Nothing comes from the server here, so `@bytemd/plugin-math` renders the math on the client.
      expect(container.querySelector('.katex')).not.toBeNull();
    });

    it('rerenders the plugins over the markup of the server on every theme change', async () => {
      mockMermaidPlugin();

      const container = mountServerHTML(valueWithDiagram, 'day');
      const { ClientMarkdownViewer, withTheme } = await importAsClient();
      let root;

      await act(() => {
        root = hydrateRoot(container, withTheme(<ClientMarkdownViewer value={valueWithDiagram} />, 'day'));
      });

      for (const [colorMode, theme] of [
        ['night', 'dark'],
        ['day', 'default'],
      ]) {
        await act(() => {
          root.render(withTheme(<ClientMarkdownViewer value={valueWithDiagram} />, colorMode));
        });

        expect(container.querySelector('.bytemd-mermaid').textContent).toBe(`diagram-${theme}`);
        expect(container.querySelector('.katex')).not.toBeNull();
        expect(visibleText(container)).not.toContain('x^2');
      }

      expect(diagramRuns).toStrictEqual(['default', 'dark', 'default']);
    });

    it('rerenders the plugins over the markup of the client when nothing came from the server', async () => {
      mockMermaidPlugin();

      const { ClientMarkdownViewer, withTheme } = await importAsClient();
      const container = document.createElement('div');
      let root;

      document.body.append(container);

      await act(() => {
        root = createRoot(container);
        root.render(withTheme(<ClientMarkdownViewer value={valueWithDiagram} />, 'day'));
      });

      for (const [colorMode, theme] of [
        ['night', 'dark'],
        ['day', 'default'],
      ]) {
        await act(() => {
          root.render(withTheme(<ClientMarkdownViewer value={valueWithDiagram} />, colorMode));
        });

        expect(container.querySelector('.bytemd-mermaid').textContent).toBe(`diagram-${theme}`);
        // `@bytemd/plugin-math` renders the math here, and it has to survive the same way.
        expect(container.querySelector('.katex')).not.toBeNull();
        expect(visibleText(container)).not.toContain('x^2');
      }

      expect(diagramRuns).toStrictEqual(['default', 'dark', 'default']);
    });

    it.each([
      ['the default prefix', undefined, 'user-content-titulo'],
      ['a custom prefix', 'Rafael-Content-', 'rafael-content-titulo'],
      ['an empty prefix', '', 'titulo'],
    ])('scrolls an anchor link to the heading with %s', async (_, clobberPrefix, id) => {
      const markdown = '# Titulo\n\n[ir](#titulo)';
      const container = mountServerHTML(markdown, undefined, { clobberPrefix });
      const { ClientMarkdownViewer } = await importAsClient();
      const scrollIntoView = vi.fn();

      HTMLElement.prototype.scrollIntoView = scrollIntoView;

      await act(() => {
        hydrateRoot(container, <ClientMarkdownViewer value={markdown} clobberPrefix={clobberPrefix} />);
      });

      expect(container.querySelector('h1').id).toBe(id);

      await userEvent.setup().click(container.querySelector('a[href="#titulo"]'));

      expect(scrollIntoView).toHaveBeenCalledOnce();
      expect(scrollIntoView.mock.contexts[0]).toBe(container.querySelector('h1'));
    });

    it('scrolls an anchor link clicked on an element it wraps', async () => {
      const markdown = '# Titulo\n\n[**ir**](#titulo)';
      const container = mountServerHTML(markdown);
      const { ClientMarkdownViewer } = await importAsClient();
      const scrollIntoView = vi.fn();

      HTMLElement.prototype.scrollIntoView = scrollIntoView;

      await act(() => {
        hydrateRoot(container, <ClientMarkdownViewer value={markdown} />);
      });

      await userEvent.setup().click(container.querySelector('a[href="#titulo"] strong'));

      expect(scrollIntoView.mock.contexts).toStrictEqual([container.querySelector('h1')]);
    });

    it('does not throw on an anchor link that would not be a valid selector', async () => {
      const markdown = String.raw`[ir](#a"b)`;
      const container = mountServerHTML(markdown);
      const { ClientMarkdownViewer } = await importAsClient();
      const errors = spyOnConsoleError();

      await act(() => {
        hydrateRoot(container, <ClientMarkdownViewer value={markdown} />);
      });

      await userEvent.setup().click(container.querySelector('a'));

      expect(errors).toStrictEqual([]);
    });
  });
});

function mountServerHTML(markdown, colorMode, props) {
  const viewer = <MarkdownViewer value={markdown} {...props} />;
  const html = renderToStaticMarkup(colorMode ? <ThemeProvider colorMode={colorMode}>{viewer}</ThemeProvider> : viewer);
  const container = document.createElement('div');

  // The `<link>` of the KaTeX stylesheet, which React hoists to the `<head>` on the client.
  container.innerHTML = html.replace(/^(<link[^>]*>)+/, '');
  document.body.append(container);

  return container;
}

// The MathML copy of a formula holds the TeX source, and the stylesheet hides it from the reader.
function visibleText(container) {
  const clone = container.cloneNode(true);

  clone.querySelectorAll('.katex-mathml').forEach((element) => element.remove());

  return clone.textContent;
}

function spyOnConsoleError() {
  const errors = [];

  vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));

  return errors;
}

// The `browser` field of `package.json` does not apply on Vitest, so the client stub comes in as a
// mock. `@primer/react` has to come from the same module registry, otherwise the `ThemeProvider`
// lands on another context and the `useTheme` of the viewer never sees the theme change.
async function importAsClient() {
  vi.doMock('./plugins/katex-math.server', () => import('./plugins/katex-math.browser'));
  vi.resetModules();

  const { ThemeProvider: ClientThemeProvider } = await import('@primer/react');

  return {
    ClientMarkdownViewer: (await import('./Markdown')).MarkdownViewer,
    withTheme: (children, colorMode) => <ClientThemeProvider colorMode={colorMode}>{children}</ClientThemeProvider>,
  };
}
