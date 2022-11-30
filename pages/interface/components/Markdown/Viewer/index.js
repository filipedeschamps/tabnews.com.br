import { Viewer as ByteMdViewer } from '@bytemd/react';
import DOMPurify from 'isomorphic-dompurify';

// ByteMD dependencies:
import gfmPlugin from '@bytemd/plugin-gfm';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';
import 'bytemd/dist/index.min.css';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown-light.css';

const bytemdPluginList = [gfmPlugin(), highlightSsrPlugin(), mermaidPlugin(), breaksPlugin(), gemojiPlugin()];

export default function Viewer({ value, ...props }) {
  const sanitized = DOMPurify.sanitize(value, { FORBID_ATTR: ['class'] });
  return <ByteMdViewer value={sanitized} plugins={bytemdPluginList} {...props} />;
}
