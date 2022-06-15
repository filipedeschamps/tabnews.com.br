import { join } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderAsync } from '@resvg/resvg-js';
import getConfig from 'next/config';
import { renderTemplate } from './_lib/template';
import { parseRequest } from './_lib/parser';

const fontFiles = [
  join(getConfig().serverRuntimeConfig.PROJECT_ROOT, 'public', 'fonts', 'Roboto-Regular.ttf'),
  join(getConfig().serverRuntimeConfig.PROJECT_ROOT, 'public', 'fonts', 'Roboto-Bold.ttf'),
  join(getConfig().serverRuntimeConfig.PROJECT_ROOT, 'public', 'fonts', 'NotoEmoji-Bold.ttf'),
];

export default async function handler(req, res) {
  try {
    const parsedData = parseRequest(req);
    const svg = renderToStaticMarkup(renderTemplate(parsedData));

    const result = await renderAsync(svg, {
      fitTo: {
        mode: 'width',
        value: 1280,
      },
      font: {
        fontFiles,
        loadSystemFonts: false,
        defaultFontFamily: 'Roboto',
      },
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', `image/png`);
    res.setHeader('Cache-Control', `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`);
    res.end(result.asPng());
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Internal Error</h1><p>Sorry, there was a problem</p>');
  }
}
