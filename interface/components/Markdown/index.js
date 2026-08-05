import { isTrustedDomain } from '@tabnews/helpers';
import { MarkdownEditor, MarkdownViewer } from '@tabnews/ui/markdown';

const shouldAddNofollow = (url) => !isTrustedDomain(url);

// Servido pelo próprio domínio, de `public/katex`, em vez do jsDelivr. As fontes do KaTeX são
// resolvidas em relação a este caminho, então `fonts/` precisa estar ao lado do arquivo. A versão
// tem que acompanhar a do pacote `katex`, e o teste em `tests/unit/interface` falha se divergirem.
export const katexStylesheetHref = '/katex/0.16.22/katex.min.css';

export default function Viewer(props) {
  return MarkdownViewer({
    katexStylesheetHref,
    shouldAddNofollow,
    ...props,
  });
}

export function Editor(props) {
  return MarkdownEditor({
    katexStylesheetHref,
    shouldAddNofollow,
    ...props,
  });
}
