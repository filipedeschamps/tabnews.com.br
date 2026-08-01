import { version as installedKatexVersion } from 'katex/package.json';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

import Viewer, { katexStylesheetHref } from 'interface/components/Markdown';

const katexStylesheetDirectory = `public${katexStylesheetHref.replace('/katex.min.css', '')}`;
const installedKatexDirectory = dirname(createRequire(import.meta.url).resolve('katex/dist/katex.min.css'));

describe('Markdown KaTeX stylesheet', () => {
  it('should serve the stylesheet from our own domain', () => {
    const html = renderToStaticMarkup(<Viewer value="Um $x^2$ inline" />);

    expect(html).toContain(`href="${katexStylesheetHref}"`);
    expect(html).toContain('rel="stylesheet"');
    expect(html).not.toContain('cdn.jsdelivr.net');
  });

  it('should not request the stylesheet for content without math', () => {
    const html = renderToStaticMarkup(<Viewer value="Custa 5 reais" />);

    expect(html).not.toContain('katex');
  });

  it('should point to the installed katex version', () => {
    expect(katexStylesheetHref).toBe(`/katex/${installedKatexVersion}/katex.min.css`);
  });

  it('should serve the same stylesheet the installed katex ships', () => {
    expect(existsSync(`${katexStylesheetDirectory}/katex.min.css`)).toBe(true);

    expect(readFileSync(`${katexStylesheetDirectory}/katex.min.css`, 'utf8')).toBe(
      readFileSync(`${installedKatexDirectory}/katex.min.css`, 'utf8'),
    );
  });

  it('should have exactly the fonts the stylesheet references', () => {
    const css = readFileSync(`${katexStylesheetDirectory}/katex.min.css`, 'utf8');

    // As fontes são resolvidas em relação ao arquivo `.css`, então achatar o `fonts/` quebraria
    // apenas os glifos, de forma silenciosa. Sobrar arquivo também é silencioso, só que em peso.
    const referenced = [...css.matchAll(/url\(fonts\/([^)]+\.woff2)\)/g)].map(([, file]) => file);
    const served = readdirSync(`${katexStylesheetDirectory}/fonts`);

    expect(served.toSorted()).toStrictEqual([...new Set(referenced)].toSorted());
  });

  it('should serve the same font files the installed katex ships', () => {
    const served = readdirSync(`${katexStylesheetDirectory}/fonts`);

    for (const font of served) {
      expect(readFileSync(`${katexStylesheetDirectory}/fonts/${font}`)).toStrictEqual(
        readFileSync(`${installedKatexDirectory}/fonts/${font}`),
      );
    }
  });
});
