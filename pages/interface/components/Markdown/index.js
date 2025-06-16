import { isTrustedDomain } from '@tabnews/helpers';
import { MarkdownEditor, MarkdownViewer } from '@tabnews/ui/markdown';

const shouldAddNofollow = (url) => !isTrustedDomain(url);

export default function Viewer(props) {
  return MarkdownViewer({
    shouldAddNofollow,
    ...props,
  });
}

export function Editor(props) {
  return MarkdownEditor({
    shouldAddNofollow,
    ...props,
  });
}
