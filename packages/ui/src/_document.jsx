import NextDocument, { Head, Html, Main, NextScript } from 'next/document.js';
import Script from 'next/script.js';

// Script related to `AutoThemeProvider`, which styles `data-no-flash` with `NoFlashGlobalStyle`
export const noFlashScript = `var m=localStorage.getItem('colorMode');
if(['auto','night','dark','day','light'].includes(m))document.documentElement.setAttribute('data-no-flash',m)`;

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
  render() {
    const { htmlProps, headChildren } = documentConfig;

    return (
      <Html {...htmlProps}>
        <Head>{headChildren}</Head>
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
