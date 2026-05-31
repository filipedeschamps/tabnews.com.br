import { TabNav, TabNavLink } from '@/TabNewsUI';

import classes from './index.module.css';

export default function RecentTabNav() {
  return (
    <TabNav className={classes.Nav}>
      <TabNavLink
        href={{
          pathname: '/recentes/pagina/[page]',
          query: { page: 1 },
        }}>
        Publicações
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/recentes/comentarios/[page]',
          query: { page: 1 },
        }}>
        Comentários
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/recentes/classificados/[page]',
          query: { page: 1 },
        }}>
        Classificados
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/recentes/todos/[page]',
          query: { page: 1 },
        }}>
        Todos
      </TabNavLink>
    </TabNav>
  );
}
