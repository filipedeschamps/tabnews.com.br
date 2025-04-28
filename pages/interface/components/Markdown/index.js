import { MarkdownEditor, MarkdownViewer } from '@tabnews/ui/markdown';

import { isTrustedDomain } from 'pages/interface';

const shouldAddNofollow = (url) => !isTrustedDomain(url);

export default function Viewer(props) {
  return MarkdownViewer({
    shouldAddNofollow,
    ...props,
  });
}

export function Editor({ compact, ...props }) {
  return MarkdownEditor({
    initialHeight: compact ? undefined : 'calc(100vh - 410px)',
    shouldAddNofollow,
    ...props,
  });
}
