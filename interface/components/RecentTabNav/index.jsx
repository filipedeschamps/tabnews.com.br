import { UnderlineNav, UnderlineNavItem } from '@/TabNewsUI';

import classes from './index.module.css';

export default function RecentTabNav() {
  return (
    <UnderlineNav aria-label="Conteúdos recentes" className={classes.Nav}>
      <UnderlineNavItem
        href={{
          pathname: '/recentes/pagina/[page]',
          query: { page: 1 },
        }}>
        Publicações
      </UnderlineNavItem>
      <UnderlineNavItem
        href={{
          pathname: '/recentes/comentarios/[page]',
          query: { page: 1 },
        }}>
        Comentários
      </UnderlineNavItem>
      <UnderlineNavItem
        href={{
          pathname: '/recentes/classificados/[page]',
          query: { page: 1 },
        }}>
        Classificados
      </UnderlineNavItem>
      <UnderlineNavItem
        href={{
          pathname: '/recentes/todos/[page]',
          query: { page: 1 },
        }}>
        Todos
      </UnderlineNavItem>
    </UnderlineNav>
  );
}
