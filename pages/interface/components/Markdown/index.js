import { isTrustedDomain } from '@tabnews/helpers';
import { MarkdownEditor, MarkdownViewer } from '@tabnews/ui/markdown';
import { useEffect } from 'react';

const shouldAddNofollow = (url) => !isTrustedDomain(url);

export default function Viewer(props) {
  useEffect(() => {
    const savedPos = sessionStorage.getItem('scrollPos');

    if (savedPos) {
      console.warn('Posição do Scroll RESTAURADA:', savedPos);

      window.scrollTo(0, parseInt(savedPos, 10));

      sessionStorage.removeItem('scrollPos');
    }
  }, [props.content]);
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
