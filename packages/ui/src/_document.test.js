import { render } from '@testing-library/react';
import React from 'react';

import { configureDocument, Document } from './_document.jsx';

describe('ui', () => {
  describe('_document', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderOnMockRoot(<Document />);

      expect(container.innerHTML).toContain('<main');

      expect(document.querySelector('[data-testid="Next Html"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="Next Head"]')).not.toBeNull();
      expect(getByTestId('Next App Content')).toBeDefined();
      expect(getByTestId('Next Scripts')).toBeDefined();

      const katexLink = document.head.querySelector('link[href*="katex"]');
      expect(katexLink).not.toBeNull();
      expect(katexLink.getAttribute('rel')).toBe('preload');
      expect(document.head.innerHTML).toContain('katexLink');

      expect(hoisted.nextScriptDefault).toHaveBeenCalledOnce();

      const themeScript = container.querySelector('script#theme');
      expect(themeScript).toBeDefined();
      expect(themeScript.innerHTML).toBe(
        `if (['auto','night','dark','day','light'].includes(localStorage.getItem('colorMode')))
document.documentElement.setAttribute('data-no-flash', true)`,
      );

      expect(container).toMatchSnapshot();
    });

    it('should pass the correct props to the Html component', () => {
      configureDocument({
        htmlProps: {
          lang: 'pt',
          'data-color-mode': 'dark',
        },
      });

      renderOnMockRoot(<Document />);
      const htmlTag = document.querySelector('[data-testid="Next Html"]');

      expect(htmlTag).not.toBeNull();
      expect(htmlTag.getAttribute('lang')).toBe('pt');
      expect(htmlTag.getAttribute('data-color-mode')).toBe('dark');
    });

    it('should pass the correct props to the Head component', () => {
      configureDocument({
        headChildren: <meta name="description" content="Test" />,
      });

      renderOnMockRoot(<Document />);
      const headTag = document.querySelector('[data-testid="Next Head"]');

      expect(headTag).not.toBeNull();
      expect(headTag.innerHTML).toContain('<meta name="description" content="Test">');
    });
  });
});

const hoisted = vi.hoisted(() => {
  const nextScriptDefault = vi.fn((props) => <script {...props} />);

  return {
    nextScriptDefault,
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
    if (typeof args[0] === 'string' && /cannot (appear as|be) a child of/.test(args[0])) {
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
