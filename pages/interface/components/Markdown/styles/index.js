import { useTheme } from '@/TabNewsUI';

export function EditorColors() {
  const {
    theme: { colors, shadows },
  } = useTheme();

  if (!colors || !shadows) return null;

  return (
    <style jsx global>
      {`
        .bytemd {
          color: ${colors.fg.default};
          border-color: ${colors.border.default};
          background-color: ${colors.canvas.inset};
        }
        .bytemd:focus-within {
          border-color: ${colors.accent.fg};
          box-shadow: inset 0 0 0 1px ${colors.accent.fg};
        }
        .bytemd-toolbar {
          border-bottom-color: ${colors.border.default};
          background-color: ${colors.canvas.subtle};
        }
        .bytemd-toolbar-tab-active {
          color: ${colors.accent.fg};
        }
        .bytemd-toolbar-icon:hover {
          background-color: ${colors.btn.hoverBg};
        }
        .bytemd-toolbar-icon-active {
          color: ${colors.accent.fg};
        }
        .bytemd-sidebar {
          border-color: ${colors.border.muted};
        }
        .bytemd-sidebar-close:hover {
          color: ${colors.accent.fg};
        }
        .bytemd-sidebar ul {
          color: ${colors.fg.muted};
        }
        .bytemd-dropdown-title {
          border-bottom: 1px solid ${colors.border.muted};
          color: ${colors.fg.default};
        }
        .bytemd-dropdown-item:hover {
          background-color: ${colors.actionListItem.default.selectedBg};
        }
        .bytemd-body {
          background-color: ${colors.canvas.default};
        }
        .is-invalid .bytemd {
          border-color: ${colors.danger.fg};
        }
        .is-invalid .bytemd:focus-within {
          border-color: ${colors.danger.fg};
          box-shadow: 0 0 0 3px rgb(164 14 38 / 40%);
        }
        .bytemd-toc-active {
          color: ${colors.accent.fg};
          background-color: ${colors.actionListItem.default.selectedBg};
        }
        .bytemd-split .bytemd-preview {
          border-left: 1px solid ${colors.border.muted};
        }
        .bytemd-fullscreen.bytemd {
          background-color: ${colors.canvas.subtle};
        }
        .bytemd-fullscreen.bytemd:focus-within {
          box-shadow: none;
        }
        .tippy-box {
          background-color: ${colors.neutral.emphasisPlus};
          color: ${colors.fg.onEmphasis};
        }
        .tippy-arrow {
          color: ${colors.neutral.emphasisPlus};
        }
        .tippy-box[data-theme~='light-border'] {
          background-color: ${colors.canvas.default};
          color: ${colors.fg.subtle};
          box-shadow: ${shadows.overlay.shadow};
        }
        .tippy-box[data-theme~='light-border'] > .tippy-backdrop {
          background-color: #fff;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-arrow:before {
          border-top-color: #fff;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='left'] > .tippy-arrow:before {
          border-left-color: #fff;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='left'] > .tippy-arrow:after {
          border-left-color: #00081033;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='right'] > .tippy-arrow:before {
          border-right-color: #fff;
          right: 16px;
        }
        .tippy-box[data-theme~='light-border'] > .tippy-svg-arrow {
          fill: #fff;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-arrow:after {
          border-top-color: #00081033;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='bottom'] > .tippy-arrow:before {
          border-bottom-color: #fff;
          bottom: 16px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='bottom'] > .tippy-arrow:after {
          border-bottom-color: #00081033;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='right'] > .tippy-arrow:after {
          border-right-color: #00081033;
        }

        .bytemd-editor .CodeMirror {
          color: ${colors.accent.default};
          border-color: ${colors.border.default};
          background-color: ${colors.canvas.inset};
        }
        .bytemd-editor .CodeMirror pre.CodeMirror-placeholder {
          color: ${colors.canvas.subtle};
        }

        .CodeMirror:focus-within {
          background-color: ${colors.canvas.default};
        }
        .CodeMirror {
          color: ${colors.codemirror.text};
        }
        .CodeMirror-guttermarker {
          color: ${colors.codemirror.guttermarkerText};
        }
        .CodeMirror-guttermarker-subtle {
          color: ${colors.codemirror.guttermarkerSubtleText};
        }
        .CodeMirror-linenumber {
          color: ${colors.codemirror.linenumberText};
        }
        .CodeMirror-scrollbar-filler,
        .CodeMirror-gutter-filler {
          background-color: ${colors.codemirror.gutterBg};
        }
        .CodeMirror-gutters {
          border-right-color: ${colors.border.muted};
          background-color: ${colors.codemirror.gutterBg};
        }
        .CodeMirror-gutter-wrapper ::selection {
          background-color: transparent;
        }
        .CodeMirror-cursor {
          border-right: thin solid ${colors.codemirror.cursor} !important;
        }
        .cm-s-default .cm-header {
          color: ${colors.prettylights.syntax.markupHeading};
        }
        .cm-s-default .cm-quote {
          color: ${colors.prettylights.syntax.markupInsertedText};
        }
        .cm-negative {
          color: ${colors.prettylights.syntax.markupDeletedText};
        }
        .cm-positive {
          color: ${colors.prettylights.syntax.markupInsertedText};
        }
        .cm-s-default .cm-keyword {
          color: ${colors.prettylights.syntax.keyword};
        }
        .cm-s-default .cm-atom {
          color: ${colors.accent.fg};
        }
        .cm-s-default .cm-number {
          color: ${colors.prettylights.syntax.markupInsertedText};
        }
        .cm-s-default .cm-def {
          color: ${colors.prettylights.syntax.storageModifierImport};
        }
        .cm-s-default .cm-variable {
          color: ${colors.prettylights.syntax.markupList};
        }
        .cm-s-default .cm-variable-2 {
          color: ${colors.prettylights.syntax.markupList};
        }
        .cm-s-default .cm-variable-3,
        .cm-s-default .cm-type {
          color: ${colors.prettylights.syntax.markupInsertedText};
        }
        .cm-s-default .cm-comment {
          color: ${colors.prettylights.syntax.variable};
        }
        .cm-s-default .cm-string {
          color: ${colors.prettylights.syntax.string};
        }
        .cm-s-default .cm-string-2 {
          color: ${colors.prettylights.syntax.markupList};
        }
        .cm-s-default .cm-meta,
        .cm-s-default .cm-qualifier {
          color: ${colors.prettylights.syntax.markupList};
        }
        .cm-s-default .cm-builtin {
          color: ${colors.prettylights.syntax.variable};
        }
        .cm-s-default .cm-bracket {
          color: ${colors.codemirror.matchingbracketText};
        }
        .cm-s-default .cm-tag {
          color: ${colors.prettylights.syntax.entityTag};
        }
        .cm-s-default .cm-attribute {
          color: ${colors.codemirror.syntax.constant};
        }
        .cm-s-default .cm-hr {
          color: ${colors.prettylights.syntax.sublimelinterGutterMark};
        }
        .cm-s-default .cm-link {
          color: ${colors.accent.fg};
        }
        .cm-s-default .cm-error,
        .cm-invalidchar {
          color: ${colors.prettylights.syntax.invalidIllegalText};
        }
        div.CodeMirror span.CodeMirror-matchingbracket {
          color: ${colors.codemirror.matchingBracketText};
        }
        div.CodeMirror span.CodeMirror-nonmatchingbracket {
          color: ${colors.prettylights.syntax.brackethighlighterUnmatched};
        }
        .CodeMirror-matchingtag {
          background: ${colors.attention.muted};
        }
        .CodeMirror-activeline-background {
          background: ${colors.codemirror.activeLineBg};
        }
        .CodeMirror-focused .CodeMirror-selected {
          background: ${colors.codemirror.selectionBg};
        }
        .CodeMirror-selected {
          background: transparent;
        }
        span.CodeMirror-selectedtext {
          background: none;
        }
        .CodeMirror-line::selection,
        .CodeMirror-line > span::selection,
        .CodeMirror-line > span > span::selection {
          background: ${colors.codemirror.selectionBg};
        }
        .cm-searching {
          background-color: ${colors.searchKeyword.hl};
        }
        .CodeMirror-sizer {
          border-right: 50px solid transparent;
        }
        .CodeMirror pre.CodeMirror-line,
        .CodeMirror pre.CodeMirror-line-like {
          color: inherit;
          -webkit-tap-highlight-color: transparent;
        }
      `}
    </style>
  );
}

export function EditorStyles({ mode, compact }) {
  return (
    <style jsx global>
      {`
        .bytemd-status {
          display: none;
        }
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(1),
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(4) {
          display: ${mode !== 'split' ? 'none' : 'inline-block'};
        }
        .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(6) {
          display: ${mode === 'split' ? 'none' : 'inline-block'};
        }
        .bytemd-body {
          height: ${compact ? '30vh' : 'calc(100vh - 410px)'};
          min-height: 150px;
          overflow: auto;
          resize: vertical;
          border-radius: 4px;
        }
        .bytemd-fullscreen .bytemd-body {
          flex: 1;
          resize: none;
        }
        .bytemd-fullscreen {
          display: flex !important;
          flex-direction: column;
        }
        .bytemd {
          display: inline-block;
          width: 100%;
          padding: 1px;
          border-width: 1px;
          border-style: solid;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji,
            Segoe UI Emoji;
          box-sizing: border-box;
        }
        .bytemd * {
          box-sizing: border-box;
        }
        .bytemd-hidden {
          display: none !important;
        }
        .bytemd .CodeMirror-scroll,
        .bytemd .CodeMirror-sizer,
        .bytemd .CodeMirror-gutter,
        .bytemd .CodeMirror-gutters,
        .bytemd .CodeMirror-linenumber {
          box-sizing: content-box;
        }
        .bytemd .CodeMirror,
        .bytemd code,
        .bytemd kbd {
          font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
        }

        .bytemd-toolbar {
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          padding: 4px 12px;
          border-bottom-width: 1px;
          border-bottom-style: solid;
          user-select: none;
          overflow: hidden;
        }
        .bytemd-toolbar-left {
          float: left;
        }
        .bytemd-toolbar-right {
          float: right;
        }
        .bytemd-toolbar-tab {
          display: inline-block;
          cursor: pointer;
          padding-left: 8px;
          padding-right: 8px;
          line-height: 24px;
          font-size: 14px;
        }
        .bytemd-toolbar-tab-active {
          text-decoration: underline;
          text-underline-position: under;
        }
        .bytemd-toolbar-icon {
          display: inline-block;
          vertical-align: top;
          cursor: pointer;
          border-radius: 4px;
          margin-left: 6px;
          margin-right: 6px;
        }
        .bytemd-toolbar-icon svg,
        .bytemd-toolbar-icon img {
          display: block;
          padding: 4px;
          width: 24px;
          height: 24px;
        }
        .bytemd-dropdown {
          max-height: 320px;
          overflow: auto;
          font-size: 14px;
        }
        .bytemd-dropdown-title {
          margin: 0 12px;
          font-weight: 500;
          line-height: 32px;
        }
        .bytemd-dropdown-item {
          padding: 4px 12px;
          height: 32px;
          cursor: pointer;
        }
        .bytemd-dropdown-item-icon {
          display: inline-block;
        }
        .bytemd-dropdown-item-icon svg {
          display: block;
          padding: 4px;
          width: 24px;
          height: 24px;
        }
        .bytemd-dropdown-item-title {
          display: inline-block;
          line-height: 24px;
          vertical-align: top;
        }
        .bytemd-editor {
          display: inline-block;
          vertical-align: top;
          height: 100%;
          overflow: hidden;
        }
        .bytemd-editor .CodeMirror {
          height: 100%;
          font-size: 14px;
          line-height: 1.5;
        }
        .bytemd-editor .CodeMirror .CodeMirror-lines {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 0;
        }
        .bytemd-editor .CodeMirror pre.CodeMirror-line,
        .bytemd-editor .CodeMirror pre.CodeMirror-line-like {
          padding: 0 4%;
        }
        .bytemd-preview {
          display: inline-block;
          vertical-align: top;
          height: 100%;
          overflow: auto;
        }
        .bytemd-preview .markdown-body {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 4%;
        }
        .bytemd-sidebar {
          display: inline-block;
          vertical-align: top;
          height: 100%;
          overflow: auto;
          font-size: 16px;
          border-width: 1px;
          border-style: solid;
          width: 280px;
          position: relative;
          padding: 0 16px;
        }
        .bytemd-sidebar-close {
          position: absolute;
          padding: 16px;
          top: 0;
          right: 0;
          cursor: pointer;
        }
        .bytemd-sidebar h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 32px 0 16px;
        }
        .bytemd-sidebar ul {
          padding-left: 0;
        }
        .bytemd-help {
          font-size: 13px;
        }
        .bytemd-help ul {
          line-height: 20px;
        }
        .bytemd-help ul svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .bytemd-help ul div {
          display: inline-block;
          vertical-align: top;
        }
        .bytemd-help li {
          list-style: none;
          margin-bottom: 12px;
        }
        .bytemd-help-icon {
          padding: 2px 0;
        }
        .bytemd-help-title {
          padding-left: 8px;
        }
        .bytemd-help-content {
          float: right;
          font-size: 12px;
        }
        .bytemd-toc li {
          list-style: none;
          margin-bottom: 4px;
          font-size: 14px;
          line-height: 2;
          cursor: pointer;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .bytemd-toc-first {
          font-weight: 500;
        }
        .bytemd-fullscreen.bytemd {
          position: fixed;
          inset: 0;
          z-index: 10;
          border: none;
          height: 100vh !important;
        }

        .CodeMirror {
          font-family: monospace;
          height: 300px;
          direction: ltr;
        }
        .CodeMirror-lines {
          padding: 4px 0;
        }
        .CodeMirror pre.CodeMirror-line,
        .CodeMirror pre.CodeMirror-line-like {
          padding: 0 4px;
        }
        .CodeMirror-gutters {
          border-right-style: solid;
          border-right-width: 1px;
          white-space: nowrap;
        }
        .CodeMirror-linenumber {
          padding: 0 3px 0 5px;
          min-width: 20px;
          text-align: right;
          white-space: nowrap;
        }
        .CodeMirror-cursor {
          border-right: none;
          width: 0;
        }
        .CodeMirror div.CodeMirror-secondarycursor {
          border-left: 1px solid silver;
        }
        .cm-tab {
          display: inline-block;
          text-decoration: inherit;
        }
        .cm-header,
        .cm-strong {
          font-weight: 700;
        }
        .cm-em {
          font-style: italic;
        }
        .cm-link {
          text-decoration: underline;
        }
        .cm-strikethrough {
          text-decoration: line-through;
        }
        .CodeMirror-composing {
          border-bottom: 2px solid;
        }
        .CodeMirror {
          position: relative;
          overflow: hidden;
          background: white;
        }
        .CodeMirror-scroll {
          overflow: scroll !important;
          margin-bottom: -50px;
          margin-right: -50px;
          padding-bottom: 50px;
          height: 100%;
          outline: none;
          position: relative;
          z-index: 0;
        }
        .CodeMirror-sizer {
          position: relative;
        }
        .CodeMirror-sizer > div {
          box-sizing: content-box;
        }
        .CodeMirror-vscrollbar,
        .CodeMirror-hscrollbar,
        .CodeMirror-scrollbar-filler,
        .CodeMirror-gutter-filler {
          position: absolute;
          z-index: 1;
          display: none;
          outline: none;
        }
        .CodeMirror-vscrollbar {
          right: 0;
          top: 0;
          overflow-x: hidden;
          overflow-y: scroll;
        }
        .CodeMirror-hscrollbar {
          bottom: 0;
          left: 0;
          overflow-y: hidden;
          overflow-x: scroll;
        }
        .CodeMirror-scrollbar-filler {
          right: 0;
          bottom: 0;
        }
        .CodeMirror-gutter-filler {
          left: 0;
          bottom: 0;
        }
        .CodeMirror-gutters {
          position: absolute;
          left: 0;
          top: 0;
          min-height: 100%;
          z-index: 3;
        }
        .CodeMirror-gutter {
          white-space: normal;
          height: 100%;
          display: inline-block;
          vertical-align: top;
          margin-bottom: -50px;
        }
        .CodeMirror-gutter-wrapper {
          position: absolute;
          z-index: 4;
          background: none !important;
          border: none !important;
        }
        .CodeMirror-gutter-background {
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 4;
        }
        .CodeMirror-gutter-elt {
          position: absolute;
          cursor: default;
          z-index: 4;
        }
        .CodeMirror-lines {
          cursor: text;
          min-height: 1px;
        }
        .CodeMirror pre.CodeMirror-line,
        .CodeMirror pre.CodeMirror-line-like {
          -moz-border-radius: 0;
          -webkit-border-radius: 0;
          border-radius: 0;
          border-width: 0;
          background: transparent;
          font-family: inherit;
          font-size: inherit;
          margin: 0;
          white-space: pre;
          word-wrap: normal;
          line-height: inherit;
          z-index: 2;
          position: relative;
          overflow: visible;
          -webkit-font-variant-ligatures: contextual;
          font-variant-ligatures: contextual;
        }
        .CodeMirror-wrap pre.CodeMirror-line,
        .CodeMirror-wrap pre.CodeMirror-line-like {
          word-wrap: break-word;
          white-space: pre-wrap;
          word-break: normal;
        }
        .CodeMirror-linebackground {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .CodeMirror-linewidget {
          position: relative;
          z-index: 2;
          padding: 0.1px;
        }
        .CodeMirror-rtl pre {
          direction: rtl;
        }
        .CodeMirror-code {
          outline: none;
        }
        .CodeMirror-scroll,
        .CodeMirror-sizer,
        .CodeMirror-gutter,
        .CodeMirror-gutters,
        .CodeMirror-linenumber {
          -moz-box-sizing: content-box;
          box-sizing: content-box;
        }
        .CodeMirror-measure {
          position: absolute;
          width: 100%;
          height: 0;
          overflow: hidden;
          visibility: hidden;
        }
        .CodeMirror-cursor {
          position: absolute;
          pointer-events: none;
        }
        .CodeMirror-measure pre {
          position: static;
        }
        div.CodeMirror-cursors {
          visibility: hidden;
          position: relative;
          z-index: 3;
        }
        div.CodeMirror-dragcursors,
        .CodeMirror-focused div.CodeMirror-cursors {
          visibility: visible;
        }
        .CodeMirror-crosshair {
          cursor: crosshair;
        }
        .cm-force-border {
          padding-right: 0.1px;
        }
        @media print {
          .CodeMirror div.CodeMirror-cursors {
            visibility: hidden;
          }
        }
        .cm-tab-wrap-hack:after {
          content: '';
        }

        .tippy-box[data-animation='fade'][data-state='hidden'] {
          opacity: 0;
        }
        [data-tippy-root] {
          max-width: calc(100vw - 10px);
        }
        .tippy-box {
          position: relative;
          border-radius: 3px;
          font-size: 12px;
          line-height: 1.4;
          white-space: normal;
          outline: 0;
          transition-property: transform, visibility, opacity;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji,
            Segoe UI Emoji;
        }
        .tippy-box[data-placement^='top'] > .tippy-arrow {
          bottom: 0;
        }
        .tippy-box[data-placement^='top'] > .tippy-arrow:before {
          bottom: -7px;
          left: 0;
          border-width: 8px 8px 0;
          border-top-color: initial;
          transform-origin: center top;
        }
        .tippy-box[data-placement^='bottom'] > .tippy-arrow {
          top: 0;
        }
        .tippy-box[data-placement^='bottom'] > .tippy-arrow:before {
          top: -7px;
          left: 0;
          border-width: 0 8px 8px;
          border-bottom-color: initial;
          transform-origin: center bottom;
        }
        .tippy-box[data-placement^='left'] > .tippy-arrow {
          right: 0;
        }
        .tippy-box[data-placement^='left'] > .tippy-arrow:before {
          border-width: 8px 0 8px 8px;
          border-left-color: initial;
          right: -7px;
          transform-origin: center left;
        }
        .tippy-box[data-placement^='right'] > .tippy-arrow {
          left: 0;
        }
        .tippy-box[data-placement^='right'] > .tippy-arrow:before {
          left: -7px;
          border-width: 8px 8px 8px 0;
          border-right-color: initial;
          transform-origin: center right;
        }
        .tippy-box[data-inertia][data-state='visible'] {
          transition-timing-function: cubic-bezier(0.54, 1.5, 0.38, 1.11);
        }
        .tippy-arrow {
          width: 16px;
          height: 16px;
        }
        .tippy-arrow:before {
          content: '';
          position: absolute;
          border-color: transparent;
          border-style: solid;
        }
        .tippy-content {
          position: relative;
          padding: 5px 9px;
          z-index: 1;
        }
        .tippy-box[data-theme~='light-border'] {
          background-clip: padding-box;
          border-radius: 6px;
        }
        .tippy-box[data-theme~='light-border'] > .tippy-arrow:after,
        .tippy-box[data-theme~='light-border'] > .tippy-svg-arrow:after {
          content: '';
          position: absolute;
          z-index: -1;
        }
        .tippy-box[data-theme~='light-border'] > .tippy-arrow:after {
          border-color: transparent;
          border-style: solid;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-arrow:after {
          border-width: 7px 7px 0;
          top: 17px;
          left: 1px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-svg-arrow > svg {
          top: 16px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-svg-arrow:after {
          top: 17px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='bottom'] > .tippy-arrow:after {
          border-width: 0 7px 7px;
          bottom: 17px;
          left: 1px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='bottom'] > .tippy-svg-arrow > svg {
          bottom: 16px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='bottom'] > .tippy-svg-arrow:after {
          bottom: 17px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='left'] > .tippy-arrow:after {
          border-width: 7px 0 7px 7px;
          left: 17px;
          top: 1px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='left'] > .tippy-svg-arrow > svg {
          left: 11px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='left'] > .tippy-svg-arrow:after {
          left: 12px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='right'] > .tippy-arrow:after {
          border-width: 7px 7px 7px 0;
          right: 17px;
          top: 1px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='right'] > .tippy-svg-arrow > svg {
          right: 11px;
        }
        .tippy-box[data-theme~='light-border'][data-placement^='right'] > .tippy-svg-arrow:after {
          right: 12px;
        }
        .tippy-box[data-theme~='light-border'] > .tippy-svg-arrow:after {
          background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA2czEuNzk2LS4wMTMgNC42Ny0zLjYxNUM1Ljg1MS45IDYuOTMuMDA2IDggMGMxLjA3LS4wMDYgMi4xNDguODg3IDMuMzQzIDIuMzg1QzE0LjIzMyA2LjAwNSAxNiA2IDE2IDZIMHoiIGZpbGw9InJnYmEoMCwgOCwgMTYsIDAuMikiLz48L3N2Zz4=);
          background-size: 16px 6px;
          width: 16px;
          height: 6px;
        }
        .bytemd-toolbar .tippy-content {
          padding-left: 0;
          padding-right: 0;
        }
      `}
    </style>
  );
}

export function ViewerStyles() {
  // based on "highlight.js" and "github-markdown-css"

  const {
    resolvedColorScheme,
    theme: { colors, shadows },
  } = useTheme();

  if (!colors || !shadows) return null;

  return (
    <style jsx global>
      {`
        html:root {
          color-scheme: ${resolvedColorScheme};
          background: ${colors.canvas.default};
        }
        pre code.hljs {
          display: block;
          overflow-x: auto;
          padding: 1em;
        }
        code.hljs {
          padding: 3px 5px;
        }

        .hljs {
          color: ${colors.fg.default};
          background: ${colors.canvas.default};
        }
        .hljs-doctag,
        .hljs-keyword,
        .hljs-meta .hljs-keyword,
        .hljs-template-tag,
        .hljs-template-variable,
        .hljs-type,
        .hljs-variable.language_ {
          color: ${colors.prettylights.syntax.keyword};
        }
        .hljs-title,
        .hljs-title.class_,
        .hljs-title.class_.inherited__,
        .hljs-title.function_ {
          color: ${colors.prettylights.syntax.entity};
        }
        .hljs-attr,
        .hljs-attribute,
        .hljs-literal,
        .hljs-meta,
        .hljs-number,
        .hljs-operator,
        .hljs-selector-attr,
        .hljs-selector-class,
        .hljs-selector-id,
        .hljs-variable {
          color: ${colors.prettylights.syntax.constant};
        }
        .hljs-meta .hljs-string,
        .hljs-regexp,
        .hljs-string {
          color: ${colors.prettylights.syntax.string};
        }
        .hljs-built_in,
        .hljs-symbol {
          color: ${colors.prettylights.syntax.variable};
        }
        .hljs-code,
        .hljs-comment,
        .hljs-formula {
          color: ${colors.prettylights.syntax.comment};
        }
        .hljs-name,
        .hljs-quote,
        .hljs-selector-pseudo,
        .hljs-selector-tag {
          color: ${colors.prettylights.syntax.entityTag};
        }
        .hljs-subst {
          color: ${colors.prettylights.syntax.storageModifierImport};
        }
        .hljs-section {
          color: ${colors.prettylights.syntax.markupHeading};
          font-weight: 700;
        }
        .hljs-bullet {
          color: ${colors.prettylights.syntax.markupList};
        }
        .hljs-emphasis {
          color: ${colors.prettylights.syntax.markupItalic};
          font-style: italic;
        }
        .hljs-strong {
          color: ${colors.prettylights.syntax.markupBold};
          font-weight: 700;
        }
        .hljs-addition {
          color: ${colors.prettylights.syntax.markupInsertedText};
          background-color: ${colors.prettylights.syntax.markupInsertedBg};
        }
        .hljs-deletion {
          color: ${colors.prettylights.syntax.markupDeletedText};
          background-color: ${colors.prettylights.syntax.markupDeletedBg};
        }

        .markdown-body {
          -ms-text-size-adjust: 100%;
          -webkit-text-size-adjust: 100%;
          margin: 0;
          color: ${colors.fg.default};
          background-color: ${colors.canvas.default};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
            'Segoe UI Emoji';
          font-size: 16px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .markdown-body .octicon {
          display: inline-block;
          fill: currentColor;
          vertical-align: text-bottom;
        }

        .markdown-body h1:hover .anchor .octicon-link:before,
        .markdown-body h2:hover .anchor .octicon-link:before,
        .markdown-body h3:hover .anchor .octicon-link:before,
        .markdown-body h4:hover .anchor .octicon-link:before,
        .markdown-body h5:hover .anchor .octicon-link:before,
        .markdown-body h6:hover .anchor .octicon-link:before {
          width: 16px;
          height: 16px;
          content: ' ';
          display: inline-block;
          background-color: currentColor;
          -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
          mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
        }

        .markdown-body details,
        .markdown-body figcaption,
        .markdown-body figure {
          display: block;
        }

        .markdown-body summary {
          display: list-item;
        }

        .markdown-body [hidden] {
          display: none !important;
        }

        .markdown-body a {
          background-color: transparent;
          color: ${colors.accent.fg};
          text-decoration: none;
        }

        .markdown-body a:active,
        .markdown-body a:hover {
          outline-width: 0;
        }

        .markdown-body abbr[title] {
          border-bottom: none;
          text-decoration: underline dotted;
        }

        .markdown-body b,
        .markdown-body strong {
          font-weight: 600;
        }

        .markdown-body dfn {
          font-style: italic;
        }

        .markdown-body h1 {
          margin: 0.67em 0;
          font-weight: 600;
          padding-bottom: 0.3em;
          font-size: 2em;
          border-bottom: 1px solid ${colors.border.muted};
        }

        .markdown-body mark {
          background-color: ${colors.attention.subtle};
          color: ${colors.fg.default};
        }

        .markdown-body small {
          font-size: 90%;
        }

        .markdown-body sub,
        .markdown-body sup {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
        }

        .markdown-body sub {
          bottom: -0.25em;
        }

        .markdown-body sup {
          top: -0.5em;
        }

        .markdown-body img {
          border-style: none;
          max-width: 100%;
          box-sizing: content-box;
          background-color: ${colors.canvas.default};
        }

        .markdown-body code,
        .markdown-body kbd,
        .markdown-body pre,
        .markdown-body samp {
          font-family: monospace, monospace;
          font-size: 1em;
        }

        .markdown-body figure {
          margin: 1em 40px;
        }

        .markdown-body hr {
          box-sizing: content-box;
          overflow: hidden;
          background: transparent;
          border-bottom: 1px solid ${colors.border.muted};
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: ${colors.border.default};
          border: 0;
        }

        .markdown-body input {
          font: inherit;
          margin: 0;
          overflow: visible;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .markdown-body [type='button'],
        .markdown-body [type='reset'],
        .markdown-body [type='submit'] {
          -webkit-appearance: button;
        }

        .markdown-body [type='button']::-moz-focus-inner,
        .markdown-body [type='reset']::-moz-focus-inner,
        .markdown-body [type='submit']::-moz-focus-inner {
          border-style: none;
          padding: 0;
        }

        .markdown-body [type='button']:-moz-focusring,
        .markdown-body [type='reset']:-moz-focusring,
        .markdown-body [type='submit']:-moz-focusring {
          outline: 1px dotted ButtonText;
        }

        .markdown-body [type='checkbox'],
        .markdown-body [type='radio'] {
          box-sizing: border-box;
          padding: 0;
        }

        .markdown-body [type='number']::-webkit-inner-spin-button,
        .markdown-body [type='number']::-webkit-outer-spin-button {
          height: auto;
        }

        .markdown-body [type='search'] {
          -webkit-appearance: textfield;
          outline-offset: -2px;
        }

        .markdown-body [type='search']::-webkit-search-cancel-button,
        .markdown-body [type='search']::-webkit-search-decoration {
          -webkit-appearance: none;
        }

        .markdown-body ::-webkit-input-placeholder {
          color: inherit;
          opacity: 0.54;
        }

        .markdown-body ::-webkit-file-upload-button {
          -webkit-appearance: button;
          font: inherit;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        .markdown-body hr::before {
          display: table;
          content: '';
        }

        .markdown-body hr::after {
          display: table;
          clear: both;
          content: '';
        }

        .markdown-body table {
          border-spacing: 0;
          border-collapse: collapse;
          display: block;
          width: max-content;
          max-width: 100%;
          overflow: auto;
        }

        .markdown-body td,
        .markdown-body th {
          padding: 0;
        }

        .markdown-body details summary {
          cursor: pointer;
        }

        .markdown-body details:not([open]) > *:not(summary) {
          display: none !important;
        }

        .markdown-body kbd {
          display: inline-block;
          padding: 3px 5px;
          font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          line-height: 10px;
          color: ${colors.fg.default};
          vertical-align: middle;
          background-color: ${colors.canvas.subtle};
          border: solid 1px ${colors.neutral.muted};
          border-bottom-color: ${colors.neutral.muted};
          border-radius: 6px;
          box-shadow: inset 0 -1px 0 ${colors.neutral.muted};
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }

        .markdown-body h2 {
          font-weight: 600;
          padding-bottom: 0.3em;
          font-size: 1.5em;
          border-bottom: 1px solid ${colors.border.muted};
        }

        .markdown-body h3 {
          font-weight: 600;
          font-size: 1.25em;
        }

        .markdown-body h4 {
          font-weight: 600;
          font-size: 1em;
        }

        .markdown-body h5 {
          font-weight: 600;
          font-size: 0.875em;
        }

        .markdown-body h6 {
          font-weight: 600;
          font-size: 0.85em;
          color: ${colors.fg.muted};
        }

        .markdown-body p {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .markdown-body blockquote {
          margin: 0;
          padding: 0 1em;
          color: ${colors.fg.muted};
          border-left: 0.25em solid ${colors.border.default};
        }

        .markdown-body ul,
        .markdown-body ol {
          margin-top: 0;
          margin-bottom: 0;
          padding-left: 2em;
        }

        .markdown-body ol ol,
        .markdown-body ul ol {
          list-style-type: lower-roman;
        }

        .markdown-body ul ul ol,
        .markdown-body ul ol ol,
        .markdown-body ol ul ol,
        .markdown-body ol ol ol {
          list-style-type: lower-alpha;
        }

        .markdown-body dd {
          margin-left: 0;
        }

        .markdown-body tt,
        .markdown-body code {
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 12px;
        }

        .markdown-body pre {
          margin-top: 0;
          margin-bottom: 0;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 12px;
          word-wrap: normal;
        }

        .markdown-body .octicon {
          display: inline-block;
          overflow: visible !important;
          vertical-align: text-bottom;
          fill: currentColor;
        }

        .markdown-body ::placeholder {
          color: ${colors.fg.subtle};
          opacity: 1;
        }

        .markdown-body input::-webkit-outer-spin-button,
        .markdown-body input::-webkit-inner-spin-button {
          margin: 0;
          -webkit-appearance: none;
          appearance: none;
        }

        .markdown-body .pl-c {
          color: ${colors.prettylights.syntax.comment};
        }

        .markdown-body .pl-c1,
        .markdown-body .pl-s .pl-v {
          color: ${colors.prettylights.syntax.constant};
        }

        .markdown-body .pl-e,
        .markdown-body .pl-en {
          color: ${colors.prettylights.syntax.entity};
        }

        .markdown-body .pl-smi,
        .markdown-body .pl-s .pl-s1 {
          color: ${colors.prettylights.syntax.storageModifierImport};
        }

        .markdown-body .pl-ent {
          color: ${colors.prettylights.syntax.entity.tag};
        }

        .markdown-body .pl-k {
          color: ${colors.prettylights.syntax.keyword};
        }

        .markdown-body .pl-s,
        .markdown-body .pl-pds,
        .markdown-body .pl-s .pl-pse .pl-s1,
        .markdown-body .pl-sr,
        .markdown-body .pl-sr .pl-cce,
        .markdown-body .pl-sr .pl-sre,
        .markdown-body .pl-sr .pl-sra {
          color: ${colors.prettylights.syntax.string};
        }

        .markdown-body .pl-v,
        .markdown-body .pl-smw {
          color: ${colors.prettylights.syntax.variable};
        }

        .markdown-body .pl-bu {
          color: ${colors.prettylights.syntax.brackethighlighterUnmatched};
        }

        .markdown-body .pl-ii {
          color: ${colors.prettylights.syntax.invalidIllegalText};
          background-color: ${colors.prettylights.syntax.invalidIllegalBg};
        }

        .markdown-body .pl-c2 {
          color: ${colors.prettylights.syntax.carriageReturnText};
          background-color: ${colors.prettylights.syntax.carriageReturnBg};
        }

        .markdown-body .pl-sr .pl-cce {
          font-weight: bold;
          color: ${colors.prettylights.syntax.stringRegexp};
        }

        .markdown-body .pl-ml {
          color: ${colors.prettylights.syntax.markupList};
        }

        .markdown-body .pl-mh,
        .markdown-body .pl-mh .pl-en,
        .markdown-body .pl-ms {
          font-weight: bold;
          color: ${colors.prettylights.syntax.markupHeading};
        }

        .markdown-body .pl-mi {
          font-style: italic;
          color: ${colors.prettylights.syntax.markupItalic};
        }

        .markdown-body .pl-mb {
          font-weight: bold;
          color: ${colors.prettylights.syntax.markupBold};
        }

        .markdown-body .pl-md {
          color: ${colors.prettylights.syntax.markupDeletedText};
          background-color: ${colors.prettylights.syntax.MarkupDeletedBg};
        }

        .markdown-body .pl-mi1 {
          color: ${colors.prettylights.syntax.markupInsertedText};
          background-color: ${colors.prettylights.syntax.markupInsertedBg};
        }

        .markdown-body .pl-mc {
          color: ${colors.prettylights.syntax.markupChangedText};
          background-color: ${colors.prettylights.syntax.MarkupChangedBg};
        }

        .markdown-body .pl-mi2 {
          color: ${colors.prettylights.syntax.markupIgnoredText};
          background-color: ${colors.prettylights.syntax.markupIgnoredBg};
        }

        .markdown-body .pl-mdr {
          font-weight: bold;
          color: ${colors.prettylights.syntax.metaDiffRange};
        }

        .markdown-body .pl-ba {
          color: ${colors.prettylights.syntax.brackethighlighterAngle};
        }

        .markdown-body .pl-sg {
          color: ${colors.prettylights.syntax.sublimelinterGutterMark};
        }

        .markdown-body .pl-corl {
          text-decoration: underline;
          color: ${colors.prettylights.syntax.constant.otherReferenceLink};
        }

        .markdown-body [data-catalyst] {
          display: block;
        }

        .markdown-body g-emoji {
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-size: 1em;
          font-style: normal !important;
          font-weight: 400;
          line-height: 1;
          vertical-align: -0.075em;
        }

        .markdown-body g-emoji img {
          width: 1em;
          height: 1em;
        }

        .markdown-body::before {
          display: table;
          content: '';
        }

        .markdown-body::after {
          display: table;
          clear: both;
          content: '';
        }

        .markdown-body > *:first-child {
          margin-top: 0 !important;
        }

        .markdown-body > *:last-child {
          margin-bottom: 0 !important;
        }

        .markdown-body a:not([href]) {
          color: inherit;
          text-decoration: none;
        }

        .markdown-body .absent {
          color: ${colors.danger.fg};
        }

        .markdown-body .anchor {
          float: left;
          padding-right: 4px;
          margin-left: -20px;
          line-height: 1;
        }

        .markdown-body .anchor:focus {
          outline: none;
        }

        .markdown-body p,
        .markdown-body blockquote,
        .markdown-body ul,
        .markdown-body ol,
        .markdown-body dl,
        .markdown-body table,
        .markdown-body pre,
        .markdown-body details {
          margin-top: 0;
          margin-bottom: 16px;
        }

        .markdown-body blockquote > :first-child {
          margin-top: 0;
        }

        .markdown-body blockquote > :last-child {
          margin-bottom: 0;
        }

        .markdown-body sup > a::before {
          content: '[';
        }

        .markdown-body sup > a::after {
          content: ']';
        }

        .markdown-body h1 .octicon-link,
        .markdown-body h2 .octicon-link,
        .markdown-body h3 .octicon-link,
        .markdown-body h4 .octicon-link,
        .markdown-body h5 .octicon-link,
        .markdown-body h6 .octicon-link {
          color: ${colors.fg.default};
          vertical-align: middle;
          visibility: hidden;
        }

        .markdown-body h1:hover .anchor,
        .markdown-body h2:hover .anchor,
        .markdown-body h3:hover .anchor,
        .markdown-body h4:hover .anchor,
        .markdown-body h5:hover .anchor,
        .markdown-body h6:hover .anchor {
          text-decoration: none;
        }

        .markdown-body h1:hover .anchor .octicon-link,
        .markdown-body h2:hover .anchor .octicon-link,
        .markdown-body h3:hover .anchor .octicon-link,
        .markdown-body h4:hover .anchor .octicon-link,
        .markdown-body h5:hover .anchor .octicon-link,
        .markdown-body h6:hover .anchor .octicon-link {
          visibility: visible;
        }

        .markdown-body h1 tt,
        .markdown-body h1 code,
        .markdown-body h2 tt,
        .markdown-body h2 code,
        .markdown-body h3 tt,
        .markdown-body h3 code,
        .markdown-body h4 tt,
        .markdown-body h4 code,
        .markdown-body h5 tt,
        .markdown-body h5 code,
        .markdown-body h6 tt,
        .markdown-body h6 code {
          padding: 0 0.2em;
          font-size: inherit;
        }

        .markdown-body ul.no-list,
        .markdown-body ol.no-list {
          padding: 0;
          list-style-type: none;
        }

        .markdown-body ol[type='1'] {
          list-style-type: decimal;
        }

        .markdown-body ol[type='a'] {
          list-style-type: lower-alpha;
        }

        .markdown-body ol[type='i'] {
          list-style-type: lower-roman;
        }

        .markdown-body div > ol:not([type]) {
          list-style-type: decimal;
        }

        .markdown-body ul ul,
        .markdown-body ul ol,
        .markdown-body ol ol,
        .markdown-body ol ul {
          margin-top: 0;
          margin-bottom: 0;
        }

        .markdown-body li > p {
          margin-top: 16px;
        }

        .markdown-body li + li {
          margin-top: 0.25em;
        }

        .markdown-body dl {
          padding: 0;
        }

        .markdown-body dl dt {
          padding: 0;
          margin-top: 16px;
          font-size: 1em;
          font-style: italic;
          font-weight: 600;
        }

        .markdown-body dl dd {
          padding: 0 16px;
          margin-bottom: 16px;
        }

        .markdown-body table th {
          font-weight: 600;
        }

        .markdown-body table th,
        .markdown-body table td {
          padding: 6px 13px;
          border: 1px solid ${colors.border.default};
        }

        .markdown-body table tr {
          background-color: ${colors.canvas.default};
          border-top: 1px solid ${colors.border.muted};
        }

        .markdown-body table tr:nth-child(2n) {
          background-color: ${colors.canvas.subtle};
        }

        .markdown-body table img {
          background-color: transparent;
        }

        .markdown-body img[align='right'] {
          padding-left: 20px;
        }

        .markdown-body img[align='left'] {
          padding-right: 20px;
        }

        .markdown-body .emoji {
          max-width: none;
          vertical-align: text-top;
          background-color: transparent;
        }

        .markdown-body span.frame {
          display: block;
          overflow: hidden;
        }

        .markdown-body span.frame > span {
          display: block;
          float: left;
          width: auto;
          padding: 7px;
          margin: 13px 0 0;
          overflow: hidden;
          border: 1px solid ${colors.border.default};
        }

        .markdown-body span.frame span img {
          display: block;
          float: left;
        }

        .markdown-body span.frame span span {
          display: block;
          padding: 5px 0 0;
          clear: both;
          color: ${colors.fg.default};
        }

        .markdown-body span.align-center {
          display: block;
          overflow: hidden;
          clear: both;
        }

        .markdown-body span.align-center > span {
          display: block;
          margin: 13px auto 0;
          overflow: hidden;
          text-align: center;
        }

        .markdown-body span.align-center span img {
          margin: 0 auto;
          text-align: center;
        }

        .markdown-body span.align-right {
          display: block;
          overflow: hidden;
          clear: both;
        }

        .markdown-body span.align-right > span {
          display: block;
          margin: 13px 0 0;
          overflow: hidden;
          text-align: right;
        }

        .markdown-body span.align-right span img {
          margin: 0;
          text-align: right;
        }

        .markdown-body span.float-left {
          display: block;
          float: left;
          margin-right: 13px;
          overflow: hidden;
        }

        .markdown-body span.float-left span {
          margin: 13px 0 0;
        }

        .markdown-body span.float-right {
          display: block;
          float: right;
          margin-left: 13px;
          overflow: hidden;
        }

        .markdown-body span.float-right > span {
          display: block;
          margin: 13px auto 0;
          overflow: hidden;
          text-align: right;
        }

        .markdown-body code,
        .markdown-body tt {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: ${colors.neutral.muted};
          border-radius: 6px;
        }

        .markdown-body code br,
        .markdown-body tt br {
          display: none;
        }

        .markdown-body del code {
          text-decoration: inherit;
        }

        .markdown-body pre code {
          font-size: 100%;
        }

        .markdown-body pre > code {
          padding: 0;
          margin: 0;
          word-break: normal;
          white-space: pre;
          background: transparent;
          border: 0;
        }

        .markdown-body .highlight {
          margin-bottom: 16px;
        }

        .markdown-body .highlight pre {
          margin-bottom: 0;
          word-break: normal;
        }

        .markdown-body .highlight pre,
        .markdown-body pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: ${colors.canvas.subtle};
          border-radius: 6px;
        }
        .markdown-body .math {
          overflow: auto;
        }
        .markdown-body pre code,
        .markdown-body pre tt {
          display: inline;
          max-width: auto;
          padding: 0;
          margin: 0;
          overflow: visible;
          line-height: inherit;
          word-wrap: normal;
          background-color: transparent;
          border: 0;
        }

        .markdown-body .csv-data td,
        .markdown-body .csv-data th {
          padding: 5px;
          overflow: hidden;
          font-size: 12px;
          line-height: 1;
          text-align: left;
          white-space: nowrap;
        }

        .markdown-body .csv-data .blob-num {
          padding: 10px 8px 9px;
          text-align: right;
          background: ${colors.canvas.default};
          border: 0;
        }

        .markdown-body .csv-data tr {
          border-top: 0;
        }

        .markdown-body .csv-data th {
          font-weight: 600;
          background: ${colors.canvas.subtle};
          border-top: 0;
        }

        .markdown-body .footnotes {
          font-size: 12px;
          color: ${colors.fg.muted};
          border-top: 1px solid ${colors.border.default};
        }

        .markdown-body .footnotes ol {
          padding-left: 16px;
        }

        .markdown-body .footnotes li {
          position: relative;
        }

        .markdown-body .footnotes li:target::before {
          position: absolute;
          top: -8px;
          right: -8px;
          bottom: -8px;
          left: -24px;
          pointer-events: none;
          content: '';
          border: 2px solid ${colors.accent.emphasis};
          border-radius: 6px;
        }

        .markdown-body .footnotes li:target {
          color: ${colors.fg.default};
        }

        .markdown-body .footnotes .data-footnote-backref g-emoji {
          font-family: monospace;
        }

        .markdown-body .task-list-item {
          list-style-type: none;
        }

        .markdown-body .task-list-item label {
          font-weight: 400;
        }

        .markdown-body .task-list-item.enabled label {
          cursor: pointer;
        }

        .markdown-body .task-list-item + .task-list-item {
          margin-top: 3px;
        }

        .markdown-body .task-list-item .handle {
          display: none;
        }

        .markdown-body .task-list-item-checkbox {
          margin: 0 0.2em 0.25em -1.6em;
          vertical-align: middle;
        }

        .markdown-body .contains-task-list:dir(rtl) .task-list-item-checkbox {
          margin: 0 -1.6em 0.25em 0.2em;
        }

        .markdown-body ::-webkit-calendar-picker-indicator {
          filter: invert(50%);
        }
      `}
    </style>
  );
}
