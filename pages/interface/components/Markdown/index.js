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

// code to generate list of languages

// import hljs from 'highlight.js';

// function getLanguagesClassNames() {
//   let languages = [];
//   hljs.listLanguages().forEach((lang) => {
//     languages.push(`language-${lang}`);
//     hljs.getLanguage(lang).aliases?.forEach((alias) => {
//       languages.push(`language-${alias}`);
//     });
//   });
//   console.log(languages);
// }
// getLanguagesClassNames();

const languages = [
  'language-arduino',
  'language-ino',
  'language-bash',
  'language-sh',
  'language-c',
  'language-h',
  'language-cpp',
  'language-cc',
  'language-c++',
  'language-h++',
  'language-hpp',
  'language-hh',
  'language-hxx',
  'language-cxx',
  'language-csharp',
  'language-cs',
  'language-c#',
  'language-css',
  'language-diff',
  'language-patch',
  'language-go',
  'language-golang',
  'language-graphql',
  'language-gql',
  'language-ini',
  'language-toml',
  'language-java',
  'language-jsp',
  'language-javascript',
  'language-js',
  'language-jsx',
  'language-mjs',
  'language-cjs',
  'language-json',
  'language-kotlin',
  'language-kt',
  'language-kts',
  'language-less',
  'language-lua',
  'language-makefile',
  'language-mk',
  'language-mak',
  'language-make',
  'language-markdown',
  'language-md',
  'language-mkdown',
  'language-mkd',
  'language-objectivec',
  'language-mm',
  'language-objc',
  'language-obj-c',
  'language-obj-c++',
  'language-objective-c++',
  'language-perl',
  'language-pl',
  'language-pm',
  'language-php',
  'language-php-template',
  'language-plaintext',
  'language-text',
  'language-txt',
  'language-python',
  'language-py',
  'language-gyp',
  'language-ipython',
  'language-python-repl',
  'language-pycon',
  'language-r',
  'language-ruby',
  'language-rb',
  'language-gemspec',
  'language-podspec',
  'language-thor',
  'language-irb',
  'language-rust',
  'language-rs',
  'language-scss',
  'language-shell',
  'language-console',
  'language-shellsession',
  'language-sql',
  'language-swift',
  'language-typescript',
  'language-ts',
  'language-tsx',
  'language-vbnet',
  'language-vb',
  'language-wasm',
  'language-xml',
  'language-html',
  'language-xhtml',
  'language-rss',
  'language-atom',
  'language-xjb',
  'language-xsd',
  'language-xsl',
  'language-plist',
  'language-wsf',
  'language-svg',
  'language-yaml',
  'language-yml',
  'language-1c',
  'language-abnf',
  'language-accesslog',
  'language-actionscript',
  'language-as',
  'language-ada',
  'language-angelscript',
  'language-asc',
  'language-apache',
  'language-apacheconf',
  'language-applescript',
  'language-osascript',
  'language-arcade',
  'language-armasm',
  'language-arm',
  'language-asciidoc',
  'language-adoc',
  'language-aspectj',
  'language-autohotkey',
  'language-ahk',
  'language-autoit',
  'language-avrasm',
  'language-awk',
  'language-axapta',
  'language-x++',
  'language-basic',
  'language-bnf',
  'language-brainfuck',
  'language-bf',
  'language-cal',
  'language-capnproto',
  'language-capnp',
  'language-ceylon',
  'language-clean',
  'language-icl',
  'language-dcl',
  'language-clojure',
  'language-clj',
  'language-edn',
  'language-clojure-repl',
  'language-cmake',
  'language-cmake.in',
  'language-coffeescript',
  'language-coffee',
  'language-cson',
  'language-iced',
  'language-coq',
  'language-cos',
  'language-cls',
  'language-crmsh',
  'language-crm',
  'language-pcmk',
  'language-crystal',
  'language-cr',
  'language-csp',
  'language-d',
  'language-dart',
  'language-delphi',
  'language-dpr',
  'language-dfm',
  'language-pas',
  'language-pascal',
  'language-django',
  'language-jinja',
  'language-dns',
  'language-bind',
  'language-zone',
  'language-dockerfile',
  'language-docker',
  'language-dos',
  'language-bat',
  'language-cmd',
  'language-dsconfig',
  'language-dts',
  'language-dust',
  'language-dst',
  'language-ebnf',
  'language-elixir',
  'language-ex',
  'language-exs',
  'language-elm',
  'language-erb',
  'language-erlang-repl',
  'language-erlang',
  'language-erl',
  'language-excel',
  'language-xlsx',
  'language-xls',
  'language-fix',
  'language-flix',
  'language-fortran',
  'language-f90',
  'language-f95',
  'language-fsharp',
  'language-fs',
  'language-f#',
  'language-gams',
  'language-gms',
  'language-gauss',
  'language-gss',
  'language-gcode',
  'language-nc',
  'language-gherkin',
  'language-feature',
  'language-glsl',
  'language-gml',
  'language-golo',
  'language-gradle',
  'language-groovy',
  'language-haml',
  'language-handlebars',
  'language-hbs',
  'language-html.hbs',
  'language-html.handlebars',
  'language-htmlbars',
  'language-haskell',
  'language-hs',
  'language-haxe',
  'language-hx',
  'language-hsp',
  'language-http',
  'language-https',
  'language-hy',
  'language-hylang',
  'language-inform7',
  'language-i7',
  'language-irpf90',
  'language-isbl',
  'language-jboss-cli',
  'language-wildfly-cli',
  'language-julia',
  'language-julia-repl',
  'language-jldoctest',
  'language-lasso',
  'language-ls',
  'language-lassoscript',
  'language-latex',
  'language-tex',
  'language-ldif',
  'language-leaf',
  'language-lisp',
  'language-livecodeserver',
  'language-livescript',
  'language-ls',
  'language-llvm',
  'language-lsl',
  'language-mathematica',
  'language-mma',
  'language-wl',
  'language-matlab',
  'language-maxima',
  'language-mel',
  'language-mercury',
  'language-m',
  'language-moo',
  'language-mipsasm',
  'language-mips',
  'language-mizar',
  'language-mojolicious',
  'language-monkey',
  'language-moonscript',
  'language-moon',
  'language-n1ql',
  'language-nestedtext',
  'language-nt',
  'language-nginx',
  'language-nginxconf',
  'language-nim',
  'language-nix',
  'language-nixos',
  'language-node-repl',
  'language-nsis',
  'language-ocaml',
  'language-ml',
  'language-openscad',
  'language-scad',
  'language-oxygene',
  'language-parser3',
  'language-pf',
  'language-pf.conf',
  'language-pgsql',
  'language-postgres',
  'language-postgresql',
  'language-pony',
  'language-powershell',
  'language-pwsh',
  'language-ps',
  'language-ps1',
  'language-processing',
  'language-pde',
  'language-profile',
  'language-prolog',
  'language-properties',
  'language-protobuf',
  'language-puppet',
  'language-pp',
  'language-purebasic',
  'language-pb',
  'language-pbi',
  'language-q',
  'language-k',
  'language-kdb',
  'language-qml',
  'language-qt',
  'language-reasonml',
  'language-re',
  'language-rib',
  'language-roboconf',
  'language-graph',
  'language-instances',
  'language-routeros',
  'language-mikrotik',
  'language-rsl',
  'language-ruleslanguage',
  'language-sas',
  'language-scala',
  'language-scheme',
  'language-scilab',
  'language-sci',
  'language-smali',
  'language-smalltalk',
  'language-st',
  'language-sml',
  'language-ml',
  'language-sqf',
  'language-stan',
  'language-stanfuncs',
  'language-stata',
  'language-do',
  'language-ado',
  'language-step21',
  'language-p21',
  'language-step',
  'language-stp',
  'language-stylus',
  'language-styl',
  'language-subunit',
  'language-taggerscript',
  'language-tap',
  'language-tcl',
  'language-tk',
  'language-thrift',
  'language-tp',
  'language-twig',
  'language-craftcms',
  'language-vala',
  'language-vbscript',
  'language-vbs',
  'language-vbscript-html',
  'language-verilog',
  'language-v',
  'language-sv',
  'language-svh',
  'language-vhdl',
  'language-vim',
  'language-wren',
  'language-x86asm',
  'language-xl',
  'language-tao',
  'language-xquery',
  'language-xpath',
  'language-xq',
  'language-zephir',
  'language-zep',
];
