const { config, hooks, inFlight, renders } = vi.hoisted(() => ({
  config: {},
  hooks: { onRender: null },
  inFlight: { count: 0 },
  renders: [],
}));

vi.mock('mermaid', () => ({
  default: {
    // `initialize` is global on the real `mermaid` too, which is why a pass can paint with the
    // theme of another.
    initialize: (initialConfig) => Object.assign(config, initialConfig),
    render: (id, source, container) => {
      inFlight.count++;
      renders.push({ id, source, theme: config.theme, isOnScreen: container.isConnected, inFlight: inFlight.count });
      hooks.onRender?.();

      return Promise.resolve().then(() => {
        inFlight.count--;

        if (source === 'not a diagram') throw new Error('Syntax error in text');

        return { svg: `<svg data-id="${id}"></svg>` };
      });
    },
  },
}));

import { mermaidPlugin } from './mermaid';

describe('ui', () => {
  describe('mermaidPlugin', () => {
    beforeAll(() => {
      // The source of a diagram is read from `innerText`, which jsdom does not implement.
      Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() {
          return this.textContent;
        },
      });
    });

    beforeEach(() => {
      renders.length = 0;
      hooks.onRender = null;
      delete config.theme;
      document.body.innerHTML = '';
      // jsdom has no layout, and an element without a box is treated as hidden.
      vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}]);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
      delete globalThis.IntersectionObserver;
    });

    it('renders every diagram in place of its code block', async () => {
      const markdownBody = mountMarkdownBody(['graph TD\nA-->B', 'pie\n"Cats" : 85']);

      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      const diagrams = markdownBody.querySelectorAll('.bytemd-mermaid');

      expect(markdownBody.querySelector('code.language-mermaid')).toBeNull();
      expect(renders.map(({ source }) => source)).toStrictEqual(['graph TD\nA-->B', 'pie\n"Cats" : 85']);
      expect([...diagrams].map((diagram) => diagram.innerHTML)).toStrictEqual(
        renders.map(({ id }) => `<svg data-id="${id}"></svg>`),
      );
    });

    it('waits for a hidden diagram to have layout, and leaves the code block until then', async () => {
      // What the editor does: its preview pane is `display: none` until the reader opens it, and
      // `mermaid` measures the labels as zero in there, which makes the render throw.
      const markdownBody = mountMarkdownBody();
      const show = hideUntilObserved(markdownBody);

      const cleanup = mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      expect(renders).toStrictEqual([]);
      expect(markdownBody.querySelector('code.language-mermaid')).not.toBeNull();

      // A pass that ends while the pane is still hidden must leave the code block behind, or the
      // next one, which only looks for code blocks, would find nothing to render.
      cleanup();
      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      show();
      await flush();

      expect(renders.map(({ source }) => source)).toStrictEqual(['graph TD\nA-->B']);
      expect(markdownBody.querySelector('.bytemd-mermaid')).not.toBeNull();
    });

    it('renders one diagram at a time', async () => {
      // `mermaid.render` is not reentrant: the diagram that parsed first is the one that comes out
      // as a syntax error when another render of the same type clears the database under it.
      const markdownBody = mountMarkdownBody(['graph TD\nA-->B', 'graph LR\nC-->D', 'graph TD\nE-->F']);

      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      expect(renders.map(({ inFlight: concurrent }) => concurrent)).toStrictEqual([1, 1, 1]);
    });

    it('keeps the queue going after a diagram that does not parse', async () => {
      const markdownBody = mountMarkdownBody(['not a diagram', 'graph TD\nA-->B']);

      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      const diagrams = markdownBody.querySelectorAll('.bytemd-mermaid');

      expect(renders.map(({ source }) => source)).toStrictEqual(['not a diagram', 'graph TD\nA-->B']);
      // The first one keeps whatever `mermaid` drew in the container before it threw.
      expect([...diagrams].map((diagram) => diagram.innerHTML)).toStrictEqual([
        '',
        `<svg data-id="${renders[1].id}"></svg>`,
      ]);
    });

    it('cancels a pass that lost the race, so the last theme is the one that paints', async () => {
      const markdownBody = mountMarkdownBody();

      // What the bytemd viewer does on an update: `off()`, and only then `on()`.
      mermaidPlugin({ theme: 'default' }).viewerEffect({ markdownBody })();
      mermaidPlugin({ theme: 'dark' }).viewerEffect({ markdownBody });

      await flush();

      expect(renders.map(({ theme }) => theme)).toStrictEqual(['dark']);
      expect(markdownBody.querySelectorAll('.bytemd-mermaid')).toHaveLength(1);
    });

    it('gives distinct ids to two viewers that resume on the same tick', async () => {
      // Only the clock is faked, and only to make the collision deterministic: two passes that
      // resume on the same tick used to share a `Date.now()`, and a repeated id makes one diagram
      // draw inside the SVG of the other.
      vi.useFakeTimers({ toFake: ['Date'] });

      mermaidPlugin().viewerEffect({ markdownBody: mountMarkdownBody() });
      mermaidPlugin().viewerEffect({ markdownBody: mountMarkdownBody() });

      await flush();

      const ids = renders.map(({ id }) => id);

      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
    });

    it('does not render into markup that left the screen', async () => {
      const markdownBody = mountMarkdownBody();

      mermaidPlugin().viewerEffect({ markdownBody });
      // The viewer rewrites the markup while the pass is still suspended.
      markdownBody.innerHTML = '<pre><code class="language-mermaid">graph TD\nC-->D</code></pre>';

      await flush();

      expect(renders).toStrictEqual([]);
      expect(markdownBody.querySelector('code.language-mermaid')).not.toBeNull();
    });

    it('does not render into a container that left the screen while it waited in the queue', async () => {
      const markdownBody = mountMarkdownBody(['graph TD\nA-->B', 'graph LR\nC-->D']);

      // The second container is already in the document, waiting its turn, when the viewer rewrites
      // the markup around it.
      hooks.onRender = () => markdownBody.replaceChildren();

      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      expect(renders).toHaveLength(1);
      expect(renders[0].isOnScreen).toBe(true);
    });

    it('renders a container that is still on screen when the pass is cancelled', async () => {
      const markdownBody = mountMarkdownBody(['graph TD\nA-->B', 'graph LR\nC-->D']);
      const cleanup = mermaidPlugin().viewerEffect({ markdownBody });

      // The second container is already on screen, waiting its turn, when the pass is cancelled. Its
      // code block is gone, so the next pass, which only looks for code blocks, would leave it blank
      // for good.
      hooks.onRender = () => cleanup();

      await flush();

      mermaidPlugin().viewerEffect({ markdownBody });
      await flush();

      expect([...markdownBody.querySelectorAll('.bytemd-mermaid')].map(({ innerHTML }) => innerHTML)).toStrictEqual(
        renders.map(({ id }) => `<svg data-id="${id}"></svg>`),
      );
    });

    it('keeps the toolbar actions of the bytemd plugin', () => {
      const [action] = mermaidPlugin({ locale: { mermaid: 'Diagramas', pie: 'Gráfico de pizza' } }).actions;

      expect(action.title).toBe('Diagramas');
      expect(action.handler.type).toBe('dropdown');
      expect(action.handler.actions.map(({ title }) => title)).toContain('Gráfico de pizza');
    });
  });
});

function mountMarkdownBody(sources = ['graph TD\nA-->B']) {
  const markdownBody = document.createElement('div');

  markdownBody.innerHTML = sources
    .map((source) => `<pre><code class="language-mermaid">${source}</code></pre>`)
    .join('');
  document.body.append(markdownBody);

  return markdownBody;
}

// Takes the layout away from everything inside `markdownBody`, as `display: none` does, and returns
// the function that gives it back and notifies whoever was observing.
function hideUntilObserved(markdownBody) {
  const observed = [];
  let isHidden = true;

  Element.prototype.getClientRects.mockImplementation(function getClientRects() {
    return isHidden && markdownBody.contains(this) ? [] : [{}];
  });

  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }

    observe(element) {
      observed.push([this, element]);
    }

    disconnect() {
      this.isDisconnected = true;
    }
  };

  return () => {
    isHidden = false;

    for (const [observer, element] of observed) {
      if (!observer.isDisconnected) observer.callback([{ target: element, isIntersecting: true }]);
    }
  };
}

// A macrotask, so that every promise the render chain queues has already settled.
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
