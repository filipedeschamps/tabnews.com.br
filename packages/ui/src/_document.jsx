import NextDocument, { Head, Html, Main, NextScript } from 'next/document.js';
import Script from 'next/script.js';
import { ServerStyleSheet } from 'styled-components';

// Script related to `AutoThemeProvider`
export const noFlashScript = `if (['auto','night','dark','day','light'].includes(localStorage.getItem('colorMode')))
document.documentElement.setAttribute('data-no-flash', true)`;

let documentConfig = {
  htmlProps: {},
};

/**
 * Configure the document properties.
 * @param {Object} config - The configuration object.
 * @param {Object} [config.htmlProps] - The HTML properties to be set on the <html> tag.
 * @param {import("react").ReactNode} [config.headChildren] - The children to be added to the <head> tag.
 */
export function configureDocument({ htmlProps = {}, headChildren } = {}) {
  documentConfig = {
    htmlProps,
    headChildren,
  };
}

const Doc = NextDocument?.default ?? NextDocument;

export class Document extends Doc {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Doc.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const { htmlProps, headChildren } = documentConfig;

    return (
      <Html {...htmlProps}>
        <Head>
          {headChildren}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
            integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <Script id="theme" strategy="beforeInteractive">
            {noFlashScript}
          </Script>
          <NextScript />
        </body>
      </Html>
    );
  }
}
