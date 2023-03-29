import { Box, EditorColors, EditorStyles } from '@/TabNewsUI';
import { Editor as ByteMdEditor, Viewer as ByteMdViewer } from '@bytemd/react';
import { useEffect, useRef } from 'react';

// ByteMD dependencies:
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import gfmPlugin from '@bytemd/plugin-gfm';
import gfmLocale from '@bytemd/plugin-gfm/locales/pt_BR.json';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mathPlugin from '@bytemd/plugin-math';
import mathLocale from '@bytemd/plugin-math/locales/pt_BR.json';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import mermaidLocale from '@bytemd/plugin-mermaid/locales/pt_BR.json';
import byteMDLocale from 'bytemd/locales/pt_BR.json';
import 'katex/dist/katex.css';

const bytemdPluginList = [
  gfmPlugin({ locale: gfmLocale }),
  highlightSsrPlugin(),
  mermaidPlugin({ locale: mermaidLocale }),
  mathPlugin({
    locale: mathLocale,
    katexOptions: { output: 'html' },
  }),
  breaksPlugin(),
  gemojiPlugin(),
];

export default function Viewer({ ...props }) {
  return <ByteMdViewer sanitize={sanitize} plugins={bytemdPluginList} {...props} />;
}

// Editor is not part of Primer, so error messages and styling need to be created manually
export function Editor({ isValid, onKeyDown, compact, ...props }) {
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
