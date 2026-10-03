/**
 * Leaves the taps on the text of the editor to the browser, so that a mobile one shows its own caret
 * handle, the one used to move the caret around.
 *
 * CodeMirror 5 cancels the default action of a tap — on `touchend` for a finger, and on the
 * `mousedown` that follows a touch it takes for a mouse — and places the caret itself. A browser only
 * shows the handle when the user placed the caret, so it only appeared on the taps CodeMirror lets
 * through, like long ones. In the `contenteditable` input style the lines are the editable element,
 * and CodeMirror already follows the selection the browser makes in them, so it can be told to
 * ignore those events. Taps outside the lines, like the empty space below them, are still
 * CodeMirror's, since there is nothing editable there for the browser to place the caret in.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function nativeTouchSelectionPlugin() {
  return {
    editorEffect({ editor }) {
      if (editor.getOption('inputStyle') !== 'contenteditable') return;

      const wrapper = editor.getWrapperElement();
      const lines = editor.getInputField();
      let isTouch = false;

      // The `mousedown` does not tell whether a touch fired it, but the `pointerdown` before it does.
      function rememberPointer(event) {
        isTouch = event.pointerType === 'touch';
      }

      function ignoreTouch(_, event) {
        if (lines.contains(event.target)) event.codemirrorIgnore = true;
      }

      function ignoreMouseFromTouch(_, event) {
        if (isTouch && lines.contains(event.target)) event.codemirrorIgnore = true;
      }

      wrapper.addEventListener('pointerdown', rememberPointer, { capture: true, passive: true });
      editor.on('touchstart', ignoreTouch);
      editor.on('mousedown', ignoreMouseFromTouch);

      return () => {
        wrapper.removeEventListener('pointerdown', rememberPointer, { capture: true });
        editor.off('touchstart', ignoreTouch);
        editor.off('mousedown', ignoreMouseFromTouch);
      };
    },
  };
}
