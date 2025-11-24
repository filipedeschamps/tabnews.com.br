export function EditorStyles({ mode, height }) {
  return (
    <style jsx="true" global="true">
      {`
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(1),
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(4) {
          display: ${mode !== 'split' ? 'none' : 'inline-block'};
        }
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(6) {
          display: ${mode === 'split' ? 'none' : 'inline-block'};
        }
        .bytemd-body {
          height: ${height};
        }
      `}
    </style>
  );
}
