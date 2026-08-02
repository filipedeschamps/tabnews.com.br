import bytemdMermaidPlugin from '@bytemd/plugin-mermaid';

// Shared by every pass of every instance: the `mermaid` renderers find their target with a global
// `select('#' + id)`, so a repeated id makes one diagram draw inside the SVG of another.
let nextDiagramId = 0;

let mermaidImport;

function importMermaid() {
  return (mermaidImport ??= import('mermaid').then(
    (module) => module.default,
    (error) => {
      // A chunk that failed to download must not stop the next pass from trying again.
      mermaidImport = undefined;

      throw error;
    },
  ));
}

// `mermaid.render` is not reentrant: the parser writes into the database of the diagram type, which
// is a module global, and `parse` clears it before reading the source. Two renders of the same type
// in flight wipe each other, and the one that started first comes out as a syntax error.
let pendingRender = Promise.resolve();

function enqueueRender(mermaid, id, source, container) {
  pendingRender = pendingRender.then(async () => {
    // An update may have taken this container off screen while it waited in line. Being on screen is
    // the whole condition, cancelled pass or not: the code block is already gone, so nobody else
    // would paint this container if this render gave up on it.
    if (!container.isConnected) return;

    try {
      const { svg } = await mermaid.render(id, source, container);

      container.innerHTML = svg;
    } catch {
      // A diagram that does not parse leaves the error one `mermaid` drew in its place.
    }
  });
}

// `mermaid` measures the labels with `getBBox`, which is all zeros in a subtree that has no layout —
// the preview pane of the editor, until the reader opens it. Every node then lands on the same point
// and the render throws, so a diagram waits for a box of its own.
function whenLaidOut(element, signal, render) {
  if (element.getClientRects().length > 0) {
    render();

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      render();
    },
    // What matters here is layout, not the viewport: a diagram far below the fold already has a box.
    { rootMargin: '100000px' },
  );

  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  observer.observe(element);
}

/**
 * Same as `@bytemd/plugin-mermaid`, whose `actions` it reuses, except that it waits for layout,
 * renders one diagram at a time, and a pass which lost the race renders nothing.
 * @returns {import('@bytemd/react').ViewerProps['plugins'][0]}
 */
export function mermaidPlugin({ locale, ...mermaidConfig } = {}) {
  return {
    actions: bytemdMermaidPlugin({ locale }).actions,

    viewerEffect({ markdownBody }) {
      const codeElements = markdownBody.querySelectorAll('pre>code.language-mermaid');

      if (codeElements.length === 0) return;

      const pass = new AbortController();
      const { signal } = pass;

      (async () => {
        const mermaid = await importMermaid();

        // `initialize` is global, so an obsolete pass must never reach it: the theme it carries is
        // the one the reader has already left behind.
        if (signal.aborted) return;

        mermaid.initialize(mermaidConfig);

        codeElements.forEach((codeElement) => {
          const pre = codeElement.parentElement;

          // The markup is rewritten on every update, so a code block collected before the await can
          // already be off screen.
          if (!pre?.isConnected) return;

          whenLaidOut(pre, signal, () => {
            const source = codeElement.innerText;
            const container = document.createElement('div');

            container.classList.add('bytemd-mermaid');
            container.style.lineHeight = 'initial';
            // Only now, so that a pass cancelled while the pane was hidden leaves the code block for
            // the next one: an update that does not rewrite the markup would find nothing else.
            pre.replaceWith(container);

            enqueueRender(mermaid, `bytemd-mermaid-${nextDiagramId++}`, source, container);
          });
        });
      })().catch(console.error);

      // The bytemd viewer calls this before starting the next pass.
      return () => pass.abort();
    },
  };
}
