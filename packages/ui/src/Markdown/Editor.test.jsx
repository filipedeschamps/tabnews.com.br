import { ThemeProvider } from '@primer/react';
import { userEvent } from '@testing-library/user-event';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { MarkdownEditor } from './Markdown';
import classes from './Markdown.module.css';

// The icons of the toolbar, in the order bytemd builds them: a dropdown on the left, and the table
// of contents, write-only and preview-only ones on the right.
const headingIcon = '.bytemd-toolbar-left [bytemd-tippy-path="0"]';
const tableOfContentsIcon = '.bytemd-toolbar-right [bytemd-tippy-path="1"]';
const writeOnlyIcon = '.bytemd-toolbar-right [bytemd-tippy-path="2"]';
const previewOnlyIcon = '.bytemd-toolbar-right [bytemd-tippy-path="3"]';
// The list icons: the unordered and ordered ones of bytemd, and the task one of its gfm plugin.
const quoteIcon = '.bytemd-toolbar-left [bytemd-tippy-path="3"]';
const unorderedListIcon = '.bytemd-toolbar-left [bytemd-tippy-path="8"]';
const orderedListIcon = '.bytemd-toolbar-left [bytemd-tippy-path="9"]';
const taskListIcon = '.bytemd-toolbar-left [bytemd-tippy-path="12"]';

describe('ui', () => {
  describe('MarkdownEditor', () => {
    it('starts write-only, without bytemd having been asked for a tab', async () => {
      const { container } = await renderEditor();

      expect(editorWrapper(container)).toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-toolbar-icon-active')).toBeNull();
      expect(container.querySelector('.bytemd-editor').style.width).toBe('50%');
    });

    it('does not take the focus away from the page when it mounts', async () => {
      const { container } = await renderEditor(focusableEditor);

      expect(container.contains(document.activeElement)).toBe(false);
    });

    it('keeps the panes to itself when the table of contents opens', async () => {
      const { container } = await renderEditor();

      await click(container, tableOfContentsIcon);

      expect(editorWrapper(container)).toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-editor').style.width).toBe('calc(50% - 140px)');
    });

    it('gives the panes back to bytemd once the reader asks for the preview', async () => {
      const { container } = await renderEditor();

      await click(container, previewOnlyIcon);

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-editor').style.display).toBe('none');
    });

    it('gives the panes back to bytemd once the reader asks for the write-only pane', async () => {
      const { container } = await renderEditor(focusableEditor);

      await click(container, writeOnlyIcon);

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-preview').style.display).toBe('none');
      // bytemd focuses the editor whenever the write tab becomes active, which is why the mode is
      // not asked for on mount.
      expect(container.contains(document.activeElement)).toBe(true);
    });

    it('focuses the text area when it is asked to', async () => {
      const { container } = await renderEditor({ ...focusableEditor, autoFocus: true });

      expect(container.contains(document.activeElement)).toBe(true);
    });

    it('leaves the layout to bytemd outside the split mode, which opens in a single pane', async () => {
      const { container } = await renderEditor({ mode: 'tab' });

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
    });

    it('survives the throttled scroll sync of bytemd when it is unmounted right after a scroll', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const { container, unmount } = await renderEditor();

      // The first call runs on the leading edge; it takes a second one to schedule the trailing
      // edge, which is the call that outlives the editor.
      scroll(container);
      scroll(container);

      await unmount();

      // bytemd only nulls the preview element the scroll sync dereferences on the next flush of
      // Svelte, which any other bytemd component mounting triggers.
      await renderEditor();

      expect(() => vi.advanceTimersByTime(2000)).not.toThrow();

      vi.useRealTimers();
    });

    it('holds a scrolled editor only until the scroll sync of bytemd has run', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const { container, unmount } = await renderEditor();
      const byteMd = container.querySelector('.bytemd');

      scroll(container);

      await unmount();

      // What detaches the markup of bytemd is its `$destroy`; React only takes away the element
      // around it.
      expect(byteMd.parentNode).not.toBeNull();

      vi.advanceTimersByTime(2000);

      expect(byteMd.parentNode).toBeNull();

      vi.useRealTimers();
    });

    it('destroys an editor that was never scrolled as soon as it unmounts', async () => {
      const { container, unmount } = await renderEditor();
      const byteMd = container.querySelector('.bytemd');

      await unmount();

      expect(byteMd.parentNode).toBeNull();
    });

    it('opens a dropdown inside the toolbar, without tippy complaining about it', async () => {
      const { container } = await renderEditor();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await hover(container, headingIcon);

      expect(container.querySelector('.bytemd-toolbar .bytemd-dropdown')).not.toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    describe('list buttons', () => {
      withRangeMeasurement();

      it.each([
        ['unordered', unorderedListIcon, '- a\n- b\n- c'],
        ['ordered', orderedListIcon, '1. a\n2. b\n3. c'],
        ['task', taskListIcon, '- [ ] a\n- [ ] b\n- [ ] c'],
      ])('toggle the %s list of the selected lines', async (_, icon, list) => {
        const { container } = await renderEditor();

        selectLines(container, 'a\nb\nc');
        await click(container, icon);

        expect(codeMirror(container).getValue()).toBe(list);
        expect(codeMirror(container).getSelection()).toBe(list);

        await click(container, icon);

        expect(codeMirror(container).getValue()).toBe('a\nb\nc');
        expect(codeMirror(container).getSelection()).toBe('a\nb\nc');
      });

      it('toggle the list of the line of the cursor when nothing is selected', async () => {
        const { container } = await renderEditor();

        codeMirror(container).setValue('a\n- b\nc');
        codeMirror(container).setCursor({ line: 1, ch: 1 });
        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe('a\nb\nc');
      });

      it('turn a list into another one instead of nesting it', async () => {
        const { container } = await renderEditor();

        selectLines(container, '- a\n- [x] b\n3. c');
        await click(container, orderedListIcon);

        expect(codeMirror(container).getValue()).toBe('1. a\n2. b\n3. c');

        await click(container, taskListIcon);

        expect(codeMirror(container).getValue()).toBe('- [ ] a\n- [ ] b\n- [ ] c');
      });

      it('complete a selection that is only partly the list, without doubling its markers', async () => {
        const { container } = await renderEditor();

        selectLines(container, '- a\nb\n- c');
        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe('- a\n- b\n- c');
      });

      it('keep the indentation and the blank lines of a list they remove', async () => {
        const { container } = await renderEditor();

        selectLines(container, '  - a\n\n  * b');
        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe('  a\n\n  b');
      });

      it('toggle a list on a line that holds a U+2028 line separator, which CodeMirror keeps inside the line', async () => {
        const { container } = await renderEditor();

        selectLines(container, 'a b');
        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe('- a b');

        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe('a b');
      });

      it('toggle the list of a very long line', async () => {
        const { container } = await renderEditor();
        const longLine = 'a'.repeat(50000);

        selectLines(container, longLine);
        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe(`- ${longLine}`);

        await click(container, unorderedListIcon);

        expect(codeMirror(container).getValue()).toBe(longLine);
      });

      it('leave the other buttons that change whole lines as bytemd made them', async () => {
        const { container } = await renderEditor();

        selectLines(container, 'a');
        await click(container, quoteIcon);
        await click(container, quoteIcon);

        expect(codeMirror(container).getValue()).toBe('> > a');
      });
    });

    describe('touch', () => {
      withRangeMeasurement();

      it('leaves a tap on the text to the browser, which then shows its caret handle', async () => {
        const { container } = await renderEditor();
        const text = container.querySelector('.CodeMirror-code');

        expect(tap(text)).toStrictEqual({ touchend: false, mousedown: false });
      });

      it('leaves CodeMirror the taps outside the text, where the browser has nothing to place the caret in', async () => {
        const { container } = await renderEditor();

        expect(tap(container.querySelector('.CodeMirror-scroll'))).toStrictEqual({ touchend: true, mousedown: true });
      });

      it('leaves CodeMirror a click of the mouse', async () => {
        const { container } = await renderEditor();
        const text = container.querySelector('.CodeMirror-code');

        text.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));

        expect(mouseDown(text)).toBe(true);
      });

      it('leaves CodeMirror the taps of the textarea input style, whose text is not editable', async () => {
        const { container } = await renderEditor(focusableEditor);

        expect(tap(container.querySelector('.CodeMirror-code'))).toStrictEqual({ touchend: true, mousedown: true });
      });
    });

    it('keeps the toolbar actions of the split mode', async () => {
      const { container } = await renderEditor();

      expect(container.querySelectorAll('.bytemd-toolbar-left > *').length).toBeGreaterThan(2);
      expect(container.querySelector(writeOnlyIcon)).not.toBeNull();
    });
  });
});

// jsdom has no `contentEditable`, the input style of the editor everywhere else, and only focuses
// what it takes for a focusable area — a textarea being one.
const focusableEditor = { editorConfig: { inputStyle: 'textarea' } };

// CodeMirror measures the text whenever the cursor moves, and jsdom has no layout to measure a range
// with.
function withRangeMeasurement() {
  beforeEach(() => {
    Range.prototype.getBoundingClientRect = () => new DOMRect();
    Range.prototype.getClientRects = () => [];
  });

  afterEach(() => {
    delete Range.prototype.getBoundingClientRect;
    delete Range.prototype.getClientRects;
  });
}

function codeMirror(container) {
  return container.querySelector('.CodeMirror').CodeMirror;
}

function selectLines(container, value) {
  codeMirror(container).setValue(value);
  codeMirror(container).execCommand('selectAll');
}

function dispatchCancelable(target, event) {
  target.dispatchEvent(event);

  return event.defaultPrevented;
}

// jsdom leaves `which`, the button CodeMirror reads, at 0 for every button.
function mouseDown(target) {
  const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'which', { value: 1 });

  return dispatchCancelable(target, event);
}

// What a finger sends, and whether CodeMirror cancelled each event. jsdom cannot build a `Touch`,
// and a finger has a contact area, without which CodeMirror takes the touch for a mouse.
function tap(target) {
  const rect = target.getBoundingClientRect();
  const touches = [
    { clientX: rect.left, clientY: rect.top, pageX: rect.left, pageY: rect.top, radiusX: 10, radiusY: 10 },
  ];
  const touchstart = new TouchEvent('touchstart', { bubbles: true, cancelable: true });

  Object.defineProperty(touchstart, 'touches', { value: touches });
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
  target.dispatchEvent(touchstart);

  const touchend = dispatchCancelable(target, new TouchEvent('touchend', { bubbles: true, cancelable: true }));

  // A browser only fires the mouse events of a tap whose `touchend` went through, and CodeMirror
  // ignores them for a second after a touch it handled.
  return {
    touchend,
    mousedown: touchend || mouseDown(target),
  };
}

function editorWrapper(container) {
  return container.querySelector(`.${classes.Editor}`);
}

function scroll(container) {
  container.querySelector('.CodeMirror-scroll').dispatchEvent(new Event('scroll'));

  // A browser would have CodeMirror emit this one off the event above, but jsdom has no layout and
  // CodeMirror ignores the scroll of a scroller it measures as having no height.
  const codeMirror = container.querySelector('.CodeMirror').CodeMirror;

  codeMirror.constructor.signal(codeMirror, 'scroll');
}

function click(container, selector) {
  return userEvent.setup().click(container.querySelector(selector));
}

function hover(container, selector) {
  return userEvent.setup().hover(container.querySelector(selector));
}

async function renderEditor(props) {
  const container = document.createElement('div');
  const root = createRoot(container);

  document.body.appendChild(container);

  await act(() => {
    root.render(
      <ThemeProvider>
        <MarkdownEditor value="" onChange={() => {}} {...props} />
      </ThemeProvider>,
    );
  });

  return { container, unmount: () => act(() => root.unmount()) };
}
