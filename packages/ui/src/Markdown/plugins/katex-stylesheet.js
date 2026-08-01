import { preinit } from 'react-dom';

// The version must match the installed `katex`, otherwise the stylesheet and the rendered markup can
// disagree. `katex-stylesheet.test.jsx` fails when they drift apart.
export const KATEX_VERSION = '0.16.22';

// The `integrity` has to be recalculated on every version bump, otherwise the browser blocks the
// stylesheet. `katex-stylesheet.test.jsx` fails when it does not match the installed file.
export const DEFAULT_STYLESHEET = {
  href: `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css`,
  integrity: 'sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP',
  crossOrigin: 'anonymous',
};

// Added by `remark-math`, through `@bytemd/plugin-math`.
const MATH_CLASS_NAMES = new Set(['math-inline', 'math-display']);

/**
 * Walks the tree iteratively, because the nesting of a content is unbounded, and stops on the first
 * formula.
 *
 * The trigger is the math parsed by `remark-math`, and not a `$` in the text, which would be a false
 * positive for prices, `$PATH` and code.
 * @param {import('hast').Node} tree
 * @returns {boolean}
 */
function hasMath(tree) {
  const nodes = [tree];

  while (nodes.length) {
    const { children, properties } = nodes.pop();
    const className = properties?.className;

    if (Array.isArray(className) && className.some((name) => MATH_CLASS_NAMES.has(name))) return true;

    if (children) nodes.push(...children);
  }

  return false;
}

/**
 * Loads the KaTeX stylesheet only for content that renders math.
 *
 * Runs on `rehype` instead of `viewerEffect` because `@bytemd/plugin-math` renders KaTeX
 * asynchronously (it dynamically imports `katex`), so the `katex` class names are not in the DOM yet
 * when the `viewerEffect` of the next plugin runs. Requesting the stylesheet while the tree is being
 * built also starts the download during SSR, before the math is painted.
 * @param {Object} [options]
 * @param {string} [options.href] - Where to load the stylesheet from. Defaults to jsDelivr, with
 * `integrity`. A custom value is assumed to be served by the application itself, so no subresource
 * integrity is used. The KaTeX fonts are resolved relative to this URL, which means a `fonts`
 * directory has to sit next to the stylesheet.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function katexStylesheetPlugin({ href } = {}) {
  const stylesheet = href ? { href } : DEFAULT_STYLESHEET;

  return {
    rehype: (processor) =>
      processor.use(() => (tree) => {
        if (!hasMath(tree)) return;

        preinit(stylesheet.href, {
          as: 'style',
          integrity: stylesheet.integrity,
          crossOrigin: stylesheet.crossOrigin,
        });
      }),
  };
}
