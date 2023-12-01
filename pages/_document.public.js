import Document, { Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { ServerStyleSheet } from 'styled-components';

const noFlashScript = `if (['auto','night'].includes(localStorage.getItem('colorMode')))
document.documentElement.setAttribute('data-no-flash', true)`;

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="pt-br">
        <Head />
        <body>
          <Script id="theme" strategy="beforeInteractive">
            {noFlashScript}
          </Script>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
