import { render } from '@testing-library/react';
import React from 'react';

import { configureDocument, Document } from './_document.jsx';

describe('ui', () => {
  describe('_document', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderOnMockRoot(<Document />);

      const bodyTag = container.querySelector('body');
      expect(bodyTag).toBeDefined();
      expect(bodyTag.innerHTML).toContain('<main');

      expect(getByTestId('Next Html')).toBeDefined();
      expect(getByTestId('Next Head')).toBeDefined();
      expect(getByTestId('Next App Content')).toBeDefined();
      expect(getByTestId('Next Scripts')).toBeDefined();

      expect(hoisted.nextScriptDefault).toHaveBeenCalledOnce();

      const themeScript = container.querySelector('script#theme');
      expect(themeScript).toBeDefined();
      expect(themeScript.innerHTML).toBe(
        `if (['auto','night','dark','day','light'].includes(localStorage.getItem('colorMode')))
document.documentElement.setAttribute('data-no-flash', true)`,
      );

      expect(container).toMatchSnapshot();
    });

    it('should properly include styled-components styles in "initialProps"', async () => {
      const ctx = {
        defaultGetInitialProps: hoisted.getInitialProps,
        renderPage: hoisted.renderPage,
      };

      const initialProps = await Document.getInitialProps(ctx);

      expect(initialProps).toStrictEqual({
        // eslint-disable-next-line react/jsx-key
        styles: [undefined, <style>Styled Components Styles</style>],
      });

      expect(hoisted.ServerStyleSheet).toHaveBeenCalledOnce();
      expect(hoisted.getStyleElement).toHaveBeenCalledOnce();
      expect(hoisted.seal).toHaveBeenCalledOnce();

      expect(hoisted.renderPage).not.toBe(ctx.renderPage);
      expect(hoisted.renderPage).not.toHaveBeenCalledOnce();
      ctx.renderPage();
      expect(hoisted.renderPage).toHaveBeenCalledOnce();

      expect(hoisted.collectStyles).toHaveBeenCalledOnce();
    });

    it('should pass the correct props to the Html component', () => {
      configureDocument({
        htmlProps: {
          lang: 'pt',
          'data-color-mode': 'dark',
        },
      });

      const { getByTestId } = renderOnMockRoot(<Document />);
      const htmlTag = getByTestId('Next Html');

      expect(htmlTag).toBeDefined();
      expect(htmlTag.getAttribute('lang')).toBe('pt');
      expect(htmlTag.getAttribute('data-color-mode')).toBe('dark');
    });

    it('should pass the correct props to the Head component', () => {
      configureDocument({
        headChildren: <meta name="description" content="Test" />,
      });

      const { getByTestId } = renderOnMockRoot(<Document />);
      const headTag = getByTestId('Next Head');

      expect(headTag).toBeDefined();
      expect(headTag.innerHTML).toContain('<meta name="description" content="Test">');
    });
  });
});

const hoisted = vi.hoisted(() => {
  const nextScriptDefault = vi.fn((props) => <script {...props} />);

  const collectStyles = vi.fn();
  const getStyleElement = vi.fn(() => <style>Styled Components Styles</style>);
  const seal = vi.fn();
  const ServerStyleSheet = vi.fn(() => ({
    collectStyles,
    getStyleElement,
    seal,
  }));

  const renderPage = vi.fn((App) => collectStyles(App));
  const getInitialProps = vi.fn(() => ({}));

  return {
    nextScriptDefault,
    ServerStyleSheet,
    collectStyles,
    getStyleElement,
    seal,
    renderPage,
    getInitialProps,
  };
});

vi.mock('next/document', () => ({
  Html: vi.fn((props) => <html lang="next-i18n" data-testid="Next Html" {...props} />),
  // eslint-disable-next-line @next/next/no-head-element
  Head: vi.fn((props) => <head data-testid="Next Head" {...props} />),
  Main: vi.fn((props) => <main data-testid="Next App Content" {...props} />),
  NextScript: vi.fn((props) => <script data-testid="Next Scripts" {...props} />),
  default: class Document extends React.Component {
    static getInitialProps(ctx) {
      return ctx.defaultGetInitialProps(ctx);
    }
  },
}));

vi.mock('next/script', () => ({ default: hoisted.nextScriptDefault }));
vi.mock('styled-components', () => ({ ServerStyleSheet: hoisted.ServerStyleSheet }));

function renderOnMockRoot(ui, options) {
  const mockRoot = document.createElement('mockroot');
  const container = document.body.appendChild(mockRoot);

  return suppressDOMNestingWarnings(() =>
    render(ui, {
      container,
      ...options,
    }),
  );
}

function suppressDOMNestingWarnings(callback) {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0].includes('cannot appear as a child of') && args[1] === '<html>' && args[2] === 'mockroot') {
      return;
    }
    originalError.call(console, ...args);
  };

  try {
    return callback();
  } finally {
    console.error = originalError;
  }
}
