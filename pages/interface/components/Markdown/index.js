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

import { copyCodeToClipboardPlugin } from './plugins/copy-code-to-clipboard';

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

function usePlugins() {
  const { colorScheme } = useTheme();

  const plugins = useMemo(() => {
    const mermaidTheme = colorScheme === 'dark' ? 'dark' : 'default';

    return [...bytemdPluginBaseList, mermaidPlugin({ locale: mermaidLocale, theme: mermaidTheme })];
  }, [colorScheme]);

  return plugins;
}

export default function Viewer({ value: _value, ...props }) {
  const bytemdPluginList = usePlugins();
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

  return <ByteMdViewer sanitize={sanitize} plugins={bytemdPluginList} value={value} {...props} />;
}

// Editor is not part of Primer, so error messages and styling need to be created manually
export function Editor({ isValid, onKeyDown, compact, ...props }) {
  const bytemdPluginList = usePlugins();
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
    <Box sx={{ width: '100%' }} ref={editorRef} className={isValid ? 'is-invalid' : ''}>
      <ByteMdEditor plugins={bytemdPluginList} mode={editorMode} locale={byteMDLocale} sanitize={sanitize} {...props} />
      <EditorStyles compact={compact} mode={editorMode} />
      <EditorColors />
    </Box>
  );
}

function sanitize(defaultSchema) {
  const schema = { ...defaultSchema };
  schema.attributes['*'] = schema.attributes['*'].filter((attr) => attr != 'className');

  schema.attributes['*'].push(['className', /^hljs|^language-|^bytemd-mermaid$|^math/]);

  return schema;
}
