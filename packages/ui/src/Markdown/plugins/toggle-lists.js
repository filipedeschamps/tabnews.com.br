// Checked in this order because a task is also a bullet.
const listMarkers = [
  { type: 'task', pattern: /^[-*+] \[[ xX]\] / },
  { type: 'bullet', pattern: /^[-*+] / },
  { type: 'ordered', pattern: /^\d+[.)] / },
];

function findMarker(text) {
  return listMarkers.find(({ pattern }) => pattern.test(text));
}

/**
 * Makes the list buttons of the toolbar toggle their list, as the ones of bold and italic do.
 *
 * bytemd (unordered and ordered lists) and its gfm plugin (task list) prepend the marker to every
 * line of the selection through `replaceLines`, whether the lines already are that list or not, so
 * a second click nests the list instead of undoing the first. Those actions are built inside
 * bytemd, with no way to be replaced, but all of them get `replaceLines` from the context that is
 * also handed to this effect, so that is where the toggle goes. What an action prepends to an empty
 * line tells which list it is; any other `replaceLines`, like the ones of headings and quotes, is
 * left untouched.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function toggleListsPlugin() {
  return {
    editorEffect(context) {
      const { editor, replaceLines } = context;

      context.replaceLines = (replace) => {
        const prefix = replace('', 0);
        const list = findMarker(prefix);

        if (!list || prefix.replace(list.pattern, '')) return replaceLines(replace);

        const [selection] = editor.listSelections();
        const lines = [];

        for (let line = selection.from().line; line <= selection.to().line; line++) {
          lines.push(editor.getLine(line));
        }

        const filledLines = lines.filter((line) => line.trim());
        const isThatList =
          filledLines.length > 0 && filledLines.every((line) => findMarker(line.trimStart())?.type === list.type);

        replaceLines((line, index) => {
          const [, indentation, text] = /^(\s*)(.*)$/.exec(line);
          const marker = findMarker(text);
          const content = marker ? text.replace(marker.pattern, '') : text;

          return indentation + (isThatList ? content : replace(content, index));
        });
      };

      return () => {
        context.replaceLines = replaceLines;
      };
    },
  };
}
