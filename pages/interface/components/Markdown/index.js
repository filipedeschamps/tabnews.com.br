import { Viewer as ByteMdViewer, Editor as ByteMdEditor } from '@bytemd/react';
import { Box } from '@primer/react';
import { useEffect, useRef } from 'react';

// ByteMD dependencies:
import gfmPlugin from '@bytemd/plugin-gfm';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import byteMDLocale from 'bytemd/locales/pt_BR.json';
import gfmLocale from '@bytemd/plugin-gfm/locales/pt_BR.json';
import mermaidLocale from '@bytemd/plugin-mermaid/locales/pt_BR.json';
import hljs from 'highlight.js';
import { u } from 'unist-builder';
import 'bytemd/dist/index.min.css';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown-light.css';

const bytemdPluginList = [
  gfmPlugin({ locale: gfmLocale }),
  highlightSsrPlugin(),
  mermaidPlugin({ locale: mermaidLocale }),
  breaksPlugin(),
  gemojiPlugin(),
];

const remarkRehypeOptions = { handlers: { code } };
const languages = [];
getLanguagesClassNames();

export default function Viewer({ ...props }) {
  return <ByteMdViewer sanitize={sanitize} plugins={bytemdPluginList} remarkRehype={remarkRehypeOptions} {...props} />;
}

// Editor is not part of Primer, so error messages and styling need to be created manually
export function Editor({ isValid, onKeyDown, ...props }) {
  const editorRef = useRef();

  useEffect(() => {
    const editorElement = editorRef.current;
    editorElement?.addEventListener('keydown', onKeyDown);
    return () => editorElement?.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <Box sx={{ width: '100%' }} ref={editorRef} className={isValid ? 'is-invalid' : ''}>
      <ByteMdEditor
        plugins={bytemdPluginList}
        mode="tab"
        locale={byteMDLocale}
        sanitize={sanitize}
        remarkRehype={remarkRehypeOptions}
        {...props}
      />

      <style global jsx>{`
        .bytemd {
          height: calc(100vh - 350px);
          min-height: 200px;
          border-radius: 6px;
          padding: 1px;
          border: 1px solid #d0d7de;
        }

        .bytemd:focus-within {
          border-color: #0969da;
          box-shadow: inset 0 0 0 1px #0969da;
        }

        .is-invalid .bytemd {
          border-color: #cf222e;
        }

        .is-invalid .bytemd:focus-within {
          border-color: #cf222e;
          box-shadow: 0 0 0 3px rgb(164 14 38 / 40%);
        }

        .bytemd .bytemd-toolbar {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }

        .bytemd .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(1),
        .bytemd .bytemd-toolbar-icon.bytemd-tippy.bytemd-tippy-right:nth-of-type(4) {
          display: none;
        }

        .bytemd .bytemd-status {
          display: none;
        }

        .bytemd-fullscreen.bytemd {
          z-index: 100;
        }

        .tippy-box {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
            'Segoe UI Emoji';
        }
      `}</style>
    </Box>
  );
}

function sanitize(defaultSchema) {
  const schema = { ...defaultSchema };
  schema.attributes['*'] = schema.attributes['*'].filter((attr) => attr != 'className');

  schema.attributes = {
    ...schema.attributes,
    code: [['className', 'hljs', ...languages]],
    span: [['className', ...hljsClassNames]],
  };

  return schema;
}

function getLanguagesClassNames() {
  hljs.listLanguages().forEach((lang) => {
    languages.push(`language-${lang}`);
    hljs.getLanguage(lang).aliases?.forEach((alias) => {
      languages.push(`language-${alias}`);
    });
  });
}

// Original code from https://github.com/syntax-tree/mdast-util-to-hast/blob/main/lib/handlers/code.js
function code(h, node) {
  const value = node.value ? node.value + '\n' : '';
  const lang = node.lang && node.lang.match(/^[^ \t]+(?=[ \t]|$)/);
  const props = {};

  if (lang) {
    props.className = ['language-' + lang[0].toLowerCase()];
  }

  const code = h(node, 'code', props, [u('text', value)]);

  if (node.meta) {
    code.data = { meta: node.meta };
  }

  return h(node.position, 'pre', [code]);
}

const hljsClassNames = [
  'hljs-doctag',
  'hljs-keyword',
  'hljs-meta',
  'hljs-template-tag',
  'hljs-template-variable',
  'hljs-type',
  'hljs-variable.language_',
  'hljs-title',
  'hljs-title.class_',
  'hljs-title.class_.inherited__',
  'hljs-title.function_',
  'hljs-attr',
  'hljs-attribute',
  'hljs-literal',
  'hljs-number',
  'hljs-operator',
  'hljs-selector-attr',
  'hljs-selector-class',
  'hljs-selector-id',
  'hljs-variable',
  'hljs-string',
  'hljs-regexp',
  'hljs-built_in',
  'hljs-symbol',
  'hljs-code',
  'hljs-comment',
  'hljs-formula',
  'hljs-name',
  'hljs-quote',
  'hljs-selector-pseudo',
  'hljs-selector-tag',
  'hljs-subst',
  'hljs-section',
  'hljs-bullet',
  'hljs-emphasis',
  'hljs-strong',
  'hljs-addition',
  'hljs-deletion',
];
