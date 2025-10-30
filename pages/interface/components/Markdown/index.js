import { isTrustedDomain } from '@tabnews/helpers';
import { MarkdownEditor, MarkdownViewer } from '@tabnews/ui/markdown';

const shouldAddNofollow = (url) => !isTrustedDomain(url);

export default function Viewer(props) {
  // Viewer é um wrapper puro agora; o scroll é tratado em `pages/_app.public.js`
  // para não duplicar e evitar efeitos colaterais em navegações SPA.
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
