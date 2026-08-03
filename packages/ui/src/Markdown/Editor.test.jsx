import { ThemeProvider } from '@primer/react';
import { userEvent } from '@testing-library/user-event';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { MarkdownEditor } from './Markdown';
import classes from './Markdown.module.css';

// The table of contents, write-only and preview-only icons of the toolbar, in the order bytemd
// builds them.
const tableOfContentsIcon = '.bytemd-toolbar-right [bytemd-tippy-path="1"]';
const writeOnlyIcon = '.bytemd-toolbar-right [bytemd-tippy-path="2"]';
const previewOnlyIcon = '.bytemd-toolbar-right [bytemd-tippy-path="3"]';

describe('ui', () => {
  describe('MarkdownEditor', () => {
    it('starts write-only, without bytemd having been asked for a tab', async () => {
      const container = await renderEditor();

      expect(editorWrapper(container)).toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-toolbar-icon-active')).toBeNull();
      expect(container.querySelector('.bytemd-editor').style.width).toBe('50%');
    });

    it('does not take the focus away from the page when it mounts', async () => {
      const container = await renderEditor(focusableEditor);

      expect(container.contains(document.activeElement)).toBe(false);
    });

    it('keeps the panes to itself when the table of contents opens', async () => {
      const container = await renderEditor();

      await click(container, tableOfContentsIcon);

      expect(editorWrapper(container)).toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-editor').style.width).toBe('calc(50% - 140px)');
    });

    it('gives the panes back to bytemd once the reader asks for the preview', async () => {
      const container = await renderEditor();

      await click(container, previewOnlyIcon);

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-editor').style.display).toBe('none');
    });

    it('gives the panes back to bytemd once the reader asks for the write-only pane', async () => {
      const container = await renderEditor(focusableEditor);

      await click(container, writeOnlyIcon);

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
      expect(container.querySelector('.bytemd-preview').style.display).toBe('none');
      // bytemd focuses the editor whenever the write tab becomes active, which is why the mode is
      // not asked for on mount.
      expect(container.contains(document.activeElement)).toBe(true);
    });

    it('focuses the text area when it is asked to', async () => {
      const container = await renderEditor({ ...focusableEditor, autoFocus: true });

      expect(container.contains(document.activeElement)).toBe(true);
    });

    it('leaves the layout to bytemd outside the split mode, which opens in a single pane', async () => {
      const container = await renderEditor({ mode: 'tab' });

      expect(editorWrapper(container)).not.toHaveClass('is-write-only');
    });

    it('keeps the toolbar actions of the split mode', async () => {
      const container = await renderEditor();

      expect(container.querySelectorAll('.bytemd-toolbar-left > *').length).toBeGreaterThan(2);
      expect(container.querySelector(writeOnlyIcon)).not.toBeNull();
    });
  });
});

// jsdom has no `contentEditable`, the input style of the editor everywhere else, and only focuses
// what it takes for a focusable area — a textarea being one.
const focusableEditor = { editorConfig: { inputStyle: 'textarea' } };

function editorWrapper(container) {
  return container.querySelector(`.${classes.Editor}`);
}

function click(container, selector) {
  return userEvent.setup().click(container.querySelector(selector));
}

async function renderEditor(props) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  await act(() => {
    createRoot(container).render(
      <ThemeProvider>
        <MarkdownEditor value="" onChange={() => {}} {...props} />
      </ThemeProvider>,
    );
  });

  return container;
}
