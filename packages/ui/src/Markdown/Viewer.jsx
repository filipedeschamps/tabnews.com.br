import { getProcessor } from 'bytemd';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

/**
 * Same as the `Viewer` of `@bytemd/react`, except that the markup rendered by the server wins.
 *
 * The server renders math that the client cannot reproduce, since `katex` is not in its bundle, so
 * reprocessing the markdown on every render, as the original does, would paint the raw TeX over it.
 * @param {Object} props
 * @param {string} [props.clobberPrefix='user-content-'] - Prefix of the heading ids, to resolve the
 * anchor links against.
 */
export function Viewer({ clobberPrefix = 'user-content-', plugins, remarkRehype, sanitize, value }) {
  const elementRef = useRef(null);
  const renderedRef = useRef(null);

  const processed = useMemo(() => {
    try {
      const file = getProcessor({ plugins, remarkRehype, sanitize }).processSync(value);

      return { file, html: file.toString() };
    } catch (error) {
      console.error(error);

      return { html: '' };
    }
  }, [plugins, remarkRehype, sanitize, value]);

  useLayoutEffect(() => {
    const markdownBody = elementRef.current;

    if (!markdownBody) return;

    const rendered = renderedRef.current;

    if (!rendered) {
      // On the first run, and only then, what is on screen came from the server.
      renderedRef.current = { html: markdownBody.innerHTML, remarkRehype, sanitize, value };
    } else {
      const isSameSource =
        rendered.value === value && rendered.remarkRehype === remarkRehype && rendered.sanitize === sanitize;

      // A theme switch only changes the plugins, and then the markup of the server is still the one
      // to start from: it has the math this side cannot render, and it gives the plugins that
      // replace their own markup the same input they had on the first run.
      if (!isSameSource) renderedRef.current = { html: processed.html, remarkRehype, sanitize, value };

      markdownBody.innerHTML = renderedRef.current.html;
    }

    const { file } = processed;

    if (!file) return;

    const cleanups = plugins?.map(({ viewerEffect }) => viewerEffect?.({ file, markdownBody }));

    return () => cleanups?.forEach((cleanup) => cleanup?.());
  }, [plugins, processed, remarkRehype, sanitize, value]);

  useEffect(() => {
    const markdownBody = elementRef.current;

    function scrollToAnchor(event) {
      // `closest`, and not the target itself, because a link can wrap other elements.
      const href = event.target.closest('a')?.getAttribute('href');

      if (!href?.startsWith('#')) return;

      const id = (clobberPrefix + href.slice(1)).replace(/["\\]/g, '\\$&');

      markdownBody.querySelector(`[id="${id}"]`)?.scrollIntoView();
    }

    markdownBody?.addEventListener('click', scrollToAnchor);

    return () => markdownBody?.removeEventListener('click', scrollToAnchor);
  }, [clobberPrefix]);

  return <MarkdownBody elementRef={elementRef} html={processed.html} />;
}

const MarkdownBody = memo(
  function MarkdownBody({ elementRef, html }) {
    // `suppressHydrationWarning` because the client cannot reproduce the math of the server.
    return (
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
        ref={elementRef}
        suppressHydrationWarning
      />
    );
  },
  // Never updates: React rewrites `dangerouslySetInnerHTML` on the first update after the hydration
  // even when the markup did not change, and that rewrite discards the nodes the effects above are
  // working on — including the diagram `@bytemd/plugin-mermaid` renders after an `await`.
  () => true,
);
