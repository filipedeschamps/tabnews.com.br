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
import byteMDLocale from 'bytemd/locales/pt_BR.json';
import 'katex/dist/katex.css';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, EditorColors, EditorStyles, useTheme } from '@/TabNewsUI';

import { anchorHeadersPlugin } from './plugins/anchor-headers';
import { copyCodeToClipboardPlugin } from './plugins/copy-code-to-clipboard';
import { externalLinksPlugin } from './plugins/external-links';
import { removeDuplicateClobberPrefix } from './plugins/remove-duplicate-clobber-prefix';

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

function usePlugins({ areLinksTrusted, clobberPrefix }) {
  const { colorScheme } = useTheme();

  const plugins = useMemo(() => {
    const mermaidTheme = colorScheme === 'dark' ? 'dark' : 'default';
    const pluginList = [
      ...bytemdPluginBaseList,
      mermaidPlugin({ locale: mermaidLocale, theme: mermaidTheme }),
      anchorHeadersPlugin({ prefix: clobberPrefix ?? 'user-content-' }),
      removeDuplicateClobberPrefix({ clobberPrefix }),
    ];

    if (!areLinksTrusted) {
      pluginList.push(externalLinksPlugin());
    }

    return pluginList;
  }, [areLinksTrusted, clobberPrefix, colorScheme]);

  return plugins;
}

export default function Viewer({ value: _value, areLinksTrusted, clobberPrefix, ...props }) {
  clobberPrefix = clobberPrefix?.toLowerCase();
  const bytemdPluginList = usePlugins({ areLinksTrusted, clobberPrefix });
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

// Editor is not part of Primer, so error messages and styling need to be created manually
export function Editor({ isInvalid, onKeyDown, compact, areLinksTrusted, clobberPrefix, ...props }) {
  clobberPrefix = clobberPrefix?.toLowerCase();
  const bytemdPluginList = usePlugins({ areLinksTrusted, clobberPrefix });
  const editorMode = 'split'; // 'tab'
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
        mode={editorMode}
        locale={byteMDLocale}
        sanitize={sanitize({ clobberPrefix })}
        editorConfig={{ autocapitalize: 'sentences', inputStyle: 'contenteditable', spellcheck: true }}
        remarkRehype={{ clobberPrefix }}
        {...props}
      />
      <EditorStyles compact={compact} mode={editorMode} />
      <EditorColors />
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
