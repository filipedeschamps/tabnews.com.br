import { canRenderMath, renderMath } from './katex-math.server';

// Added by `remark-math`, through `@bytemd/plugin-math`.
const DISPLAY_MODE_BY_CLASS_NAME = { 'math-inline': false, 'math-display': true };

const katexRawNodes = new WeakSet();

/**
 * Renders the math while the tree is built, so it reaches the browser painted. `@bytemd/plugin-math`
 * only renders in its `viewerEffect`, which leaves the raw TeX on screen until React hydrates and
 * the `katex` chunk arrives.
 *
 * Depends on `katexRawGuardPlugin` to emit the markup.
 * @param {Object} [options]
 * @param {Object} [options.katexOptions]
 * @returns {import('bytemd').BytemdPlugin}
 */
export function katexMathPlugin({ katexOptions } = {}) {
  function render(node) {
    const className = node.properties?.className;

    if (!Array.isArray(className)) return false;

    const mathClassName = Object.keys(DISPLAY_MODE_BY_CLASS_NAME).find((name) => className.includes(name));

    if (!mathClassName) return false;

    node.children = renderMath(toText(node), {
      displayMode: DISPLAY_MODE_BY_CLASS_NAME[mathClassName],
      katexOptions,
    });

    node.children.forEach((child) => katexRawNodes.add(child));

    // The `viewerEffect` of `@bytemd/plugin-math` looks for `.math.math-inline` and rerenders from
    // `innerText`, which would destroy this markup using the rendered text as its source.
    node.properties.className = className.filter((name) => name !== 'math');

    return true;
  }

  function transform(node) {
    if (render(node)) return;

    node.children?.forEach(transform);
  }

  return {
    rehype: (processor) => (canRenderMath ? processor.use(() => transform) : processor),
  };
}

/**
 * Emits the `raw` nodes of `katexMathPlugin`, which `rehype-stringify` would otherwise escape, and
 * escapes every other one. `allowDangerousHtml` has no granularity — it is read once, when
 * `rehype-stringify` is attached —, so the only way to scope it is to sweep the tree afterwards.
 *
 * Has to be the last plugin, otherwise a `raw` node created after this runs reaches the output
 * unescaped.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function katexRawGuardPlugin() {
  function escapeForeignRaw(node) {
    node.children?.forEach((child, index) => {
      if (child.type !== 'raw') return escapeForeignRaw(child);

      if (!katexRawNodes.has(child)) node.children[index] = { type: 'text', value: child.value };
    });
  }

  return {
    rehype: (processor) => {
      if (!canRenderMath) return processor;

      processor.data('settings', { ...processor.data('settings'), allowDangerousHtml: true });

      return processor.use(() => escapeForeignRaw);
    },
  };
}

function toText(node) {
  if (node.type === 'text') return node.value;

  return node.children?.map(toText).join('') ?? '';
}
