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
import { useEffect, useMemo, useRef } from 'react';

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
    const mermaidTheme = colorScheme === 'dark' ? 'dark' : 'default';
    const pluginList = [
      ...bytemdPluginBaseList,
      ...(shouldRenderMath
        ? [katexStylesheetPlugin({ href: katexStylesheetHref }), katexMathPlugin({ katexOptions })]
        : []),
      mermaidPlugin({ locale: mermaidLocale, theme: mermaidTheme }),
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

  useEffect(() => {
    const editorElement = editorRef.current;
    editorElement?.addEventListener('keydown', onKeyDown);
    return () => editorElement?.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    editorRef.current
      ?.getElementsByClassName('bytemd-toolbar-right')[0]
      ?.querySelector('[bytemd-tippy-path="2"]')
      ?.click();
  }, []);

  return (
    <div className={clsx(classes.Editor, isInvalid && 'is-invalid')} ref={editorRef}>
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
