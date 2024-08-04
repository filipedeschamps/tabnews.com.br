import { PrimerTabNav, TabNavLink } from '@/TabNewsUI';

export default function RecentTabNav() {
  return (
    <PrimerTabNav sx={{ width: '100%', mb: 3 }}>
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
    </PrimerTabNav>
  );
}
