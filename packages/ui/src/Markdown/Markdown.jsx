'use client';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import gfmPlugin from '@bytemd/plugin-gfm';
import gfmLocale from '@bytemd/plugin-gfm/locales/pt_BR.json';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mathPlugin from '@bytemd/plugin-math';
import mathLocale from '@bytemd/plugin-math/locales/pt_BR.json';
import mermaidLocale from '@bytemd/plugin-mermaid/locales/pt_BR.json';
import { Editor as ByteMdEditor } from '@bytemd/react';
import { useTheme } from '@primer/react';
import byteMDLocale from 'bytemd/locales/pt_BR.json';
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';

import classes from './Markdown.module.css';
import {
  anchorHeadersPlugin,
  copyAnchorLinkPlugin,
  copyCodeToClipboardPlugin,
  externalLinksPlugin,
  katexMathPlugin,
  katexRawGuardPlugin,
  katexStylesheetPlugin,
  mermaidPlugin,
  removeDuplicateClobberPrefix,
} from './plugins';
import { EditorStyles } from './styles';
import { Viewer } from './Viewer';

// Shared, so that a formula comes out the same whether the server or the client rendered it. The
// MathML is what a screen reader reads, since the visual markup is `aria-hidden`.
const katexOptions = { output: 'htmlAndMathml' };

// The `default` theme of mermaid derives every pie slice from a hue rotation of its cream
// `primaryColor`, so all twelve come out as pastels of very high lightness — which an HDR screen
// washes out to white. These are the `--display-*-bgColor-emphasis` of Primer, whose medium tone
// keeps the dark label of the slice legible under the 0.7 opacity mermaid paints them with. The
// eleventh is the only departure from the scale: its teal is hard to tell apart from the cyan of the
// seventh, so it takes the indigo instead.
// https://primer.style/product/ui-patterns/data-visualization/
const mermaidLightPieColors = Object.fromEntries(
  [
    '#006edb',
    '#866e04',
    '#ce2c85',
    '#2c8141',
    '#894ceb',
    '#b8500f',
    '#007b94',
    '#df0c24',
    '#527a29',
    '#856d4c',
    '#5a61e7',
    '#9d615c',
  ].map((color, index) => [`pie${index + 1}`, color]),
);

const bytemdPluginBaseList = [
  gfmPlugin({ locale: gfmLocale }),
  highlightSsrPlugin(),
  mathPlugin({
    locale: mathLocale,
    katexOptions,
  }),
  breaksPlugin(),
  gemojiPlugin(),
  copyCodeToClipboardPlugin(),
];

export function usePlugins({
  areLinksTrusted,
  clobberPrefix,
  copyAnchorLink,
  katexStylesheetHref,
  shouldAddNofollow,
  shouldRenderMath = true,
}) {
  const { colorScheme } = useTheme();

  const plugins = useMemo(() => {
    const isDarkTheme = colorScheme === 'dark';
    const pluginList = [
      ...bytemdPluginBaseList,
      ...(shouldRenderMath
        ? [katexStylesheetPlugin({ href: katexStylesheetHref }), katexMathPlugin({ katexOptions })]
        : []),
      mermaidPlugin({
        locale: mermaidLocale,
        theme: isDarkTheme ? 'dark' : 'default',
        themeVariables: isDarkTheme ? {} : mermaidLightPieColors,
      }),
      anchorHeadersPlugin({ prefix: clobberPrefix ?? 'user-content-' }),
      removeDuplicateClobberPrefix({ clobberPrefix }),
    ];

    if (copyAnchorLink !== false) {
      pluginList.push(copyAnchorLinkPlugin());
    }

    if (!areLinksTrusted) {
      pluginList.push(externalLinksPlugin({ shouldAddNofollow }));
    }

    if (shouldRenderMath) {
      pluginList.push(katexRawGuardPlugin());
    }

    return pluginList;
  }, [
    areLinksTrusted,
    clobberPrefix,
    colorScheme,
    copyAnchorLink,
    katexStylesheetHref,
    shouldAddNofollow,
    shouldRenderMath,
  ]);

  return plugins;
}

export function MarkdownViewer({
  value,
  areLinksTrusted,
  clobberPrefix: clobberPrefixProp,
  copyAnchorLink,
  footnoteBackLabel = 'Voltar ao conteúdo',
  footnoteLabel = 'Notas de rodapé',
  katexStylesheetHref,
  shouldAddNofollow,
  shouldRenderMath,
  ...props
}) {
  const clobberPrefix = clobberPrefixProp?.toLowerCase();
  const bytemdPluginList = usePlugins({
    areLinksTrusted,
    clobberPrefix,
    copyAnchorLink,
    katexStylesheetHref,
    shouldAddNofollow,
    shouldRenderMath,
  });
  const sanitizeSchema = useMemo(() => sanitize({ clobberPrefix }), [clobberPrefix]);
  const remarkRehypeOptions = useMemo(
    () => ({ clobberPrefix, footnoteBackLabel, footnoteLabel }),
    [clobberPrefix, footnoteBackLabel, footnoteLabel],
  );

  return (
    <Viewer
      clobberPrefix={clobberPrefix}
      sanitize={sanitizeSchema}
      remarkRehype={remarkRehypeOptions}
      plugins={bytemdPluginList}
      value={value}
      {...props}
    />
  );
}

export function MarkdownEditor({
  areLinksTrusted,
  clobberPrefix: clobberPrefixProp,
  editorConfig = {},
  footnoteBackLabel = 'Voltar ao conteúdo',
  footnoteLabel = 'Notas de rodapé',
  initialHeight = '30vh',
  isInvalid,
  katexStylesheetHref,
  mode = 'split', // 'tab'
  onKeyDown,
  shouldAddNofollow,
  ...props
}) {
  const clobberPrefix = clobberPrefixProp?.toLowerCase();
  const bytemdPluginList = usePlugins({ areLinksTrusted, clobberPrefix, katexStylesheetHref, shouldAddNofollow });
  const editorRef = useRef();
  // The write-only layout is ours until the reader picks a pane in the toolbar. bytemd only leaves
  // the split on its own when `activeTab` becomes `'write'`, and it focuses the editor whenever
  // that happens — which drags the page to whichever comment box is halfway down it. The other
  // modes already open in a single pane.
  const [isWriteOnly, setIsWriteOnly] = useState(mode === 'split');

  useEffect(() => {
    const editorElement = editorRef.current;
    editorElement?.addEventListener('keydown', onKeyDown);
    return () => editorElement?.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    const editorPane = editorRef.current?.querySelector('.bytemd-editor');

    if (!editorPane) return;

    // Every layout bytemd computes for the split gives each pane half of the width, so an inline
    // style without it means the reader has chosen, and from there on the panes are bytemd's again.
    const observer = new MutationObserver(() => {
      if (editorPane.style.cssText.includes('50%')) return;

      observer.disconnect();
      setIsWriteOnly(false);
    });

    observer.observe(editorPane, { attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={clsx(classes.Editor, isInvalid && 'is-invalid', isWriteOnly && 'is-write-only')} ref={editorRef}>
      <ByteMdEditor
        plugins={bytemdPluginList}
        mode={mode}
        locale={byteMDLocale}
        sanitize={sanitize({ clobberPrefix })}
        editorConfig={{ autocapitalize: 'sentences', inputStyle: 'contenteditable', spellcheck: true, ...editorConfig }}
        remarkRehype={{ clobberPrefix, footnoteBackLabel, footnoteLabel }}
        {...props}
      />
      <EditorStyles height={initialHeight} mode={mode} />
    </div>
  );
}

function sanitize(customSchema = {}) {
  return (defaultSchema) => {
    const schema = { ...defaultSchema, ...customSchema };

    schema.attributes['*'] = schema.attributes['*'].filter((attr) => !['className', 'target'].includes(attr));

    schema.attributes['*'].push(['className', /^hljs|^language-|^bytemd-mermaid$|^math/]);

    return schema;
  };
}
