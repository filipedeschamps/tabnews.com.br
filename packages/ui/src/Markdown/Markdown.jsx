'use client';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import gfmPlugin from '@bytemd/plugin-gfm';
import gfmLocale from '@bytemd/plugin-gfm/locales/pt_BR.json';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mathPlugin from '@bytemd/plugin-math';
import mathLocale from '@bytemd/plugin-math/locales/pt_BR.json';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import mermaidLocale from '@bytemd/plugin-mermaid/locales/pt_BR.json';
import { Editor as ByteMdEditor, Viewer as ByteMdViewer } from '@bytemd/react';
import { Box, useTheme } from '@primer/react';
import byteMDLocale from 'bytemd/locales/pt_BR.json';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  anchorHeadersPlugin,
  copyAnchorLinkPlugin,
  copyCodeToClipboardPlugin,
  externalLinksPlugin,
  removeDuplicateClobberPrefix,
} from './plugins';
import { EditorStyles } from './styles';

const bytemdPluginBaseList = [
  gfmPlugin({ locale: gfmLocale }),
  highlightSsrPlugin(),
  mathPlugin({
    locale: mathLocale,
    katexOptions: { output: 'html' },
  }),
  breaksPlugin(),
  gemojiPlugin(),
  copyCodeToClipboardPlugin(),
];

function usePlugins({ areLinksTrusted, clobberPrefix, shouldAddNofollow, copyAnchorLink }) {
  const { colorScheme } = useTheme();

  const plugins = useMemo(() => {
    const mermaidTheme = colorScheme === 'dark' ? 'dark' : 'default';
    const pluginList = [
      ...bytemdPluginBaseList,
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

    return pluginList;
  }, [areLinksTrusted, clobberPrefix, colorScheme, copyAnchorLink, shouldAddNofollow]);

  return plugins;
}

export function MarkdownViewer({
  value: _value,
  areLinksTrusted,
  clobberPrefix,
  copyAnchorLink,
  shouldAddNofollow,
  ...props
}) {
  clobberPrefix = clobberPrefix?.toLowerCase();
  const bytemdPluginList = usePlugins({ areLinksTrusted, clobberPrefix, copyAnchorLink, shouldAddNofollow });
  const [value, setValue] = useState(_value);

  useEffect(() => {
    let timeout;

    setValue((value) => {
      timeout = setTimeout(() => setValue(value));
      return value + '\n\u0160';
    });

    return () => clearTimeout(timeout);
  }, [bytemdPluginList]);

  useEffect(() => setValue(_value), [_value]);

  return (
    <ByteMdViewer
      sanitize={sanitize({ clobberPrefix })}
      remarkRehype={{ clobberPrefix }}
      plugins={bytemdPluginList}
      value={value}
      {...props}
    />
  );
}

export function MarkdownEditor({
  areLinksTrusted,
  clobberPrefix,
  editorConfig = {},
  initialHeight = '30vh',
  isInvalid,
  mode = 'split', // 'tab'
  onKeyDown,
  shouldAddNofollow,
  ...props
}) {
  clobberPrefix = clobberPrefix?.toLowerCase();
  const bytemdPluginList = usePlugins({ areLinksTrusted, clobberPrefix, shouldAddNofollow });
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
    <Box sx={{ width: '100%' }} ref={editorRef} className={isInvalid ? 'is-invalid' : ''}>
      <ByteMdEditor
        plugins={bytemdPluginList}
        mode={mode}
        locale={byteMDLocale}
        sanitize={sanitize({ clobberPrefix })}
        editorConfig={{ autocapitalize: 'sentences', inputStyle: 'contenteditable', spellcheck: true, ...editorConfig }}
        remarkRehype={{ clobberPrefix }}
        {...props}
      />
      <EditorStyles height={initialHeight} mode={mode} />
    </Box>
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
