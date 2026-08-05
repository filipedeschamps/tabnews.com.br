// Resolved instead of `katex-math.server.js` through the `browser` field of `package.json`, to keep
// `katex` out of the client bundle. With nothing to render, `katexMathPlugin` becomes a no-op and
// `@bytemd/plugin-math` keeps rendering the math on demand, as it does in the editor.
export const canRenderMath = false;

export function renderMath() {
  return null;
}
