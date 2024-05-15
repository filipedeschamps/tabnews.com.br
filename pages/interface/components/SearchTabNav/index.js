import { PrimerTabNav, TabNavLink } from '@/TabNewsUI';

export default function SearchTabNav({ searchTerm }) {
  return (
    <PrimerTabNav sx={{ width: '100%', mb: 3 }}>
      <TabNavLink
        href={{
          pathname: '/buscar/pagina/[page]',
          query: { q: searchTerm, page: 1 },
        }}>
        Relevantes
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/buscar/recentes/[page]',
          query: { q: searchTerm, page: 1 },
        }}>
        Recentes
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/buscar/antigos/[page]',
          query: { q: searchTerm, page: 1 },
        }}>
        Antigos
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/buscar/todos/[page]',
          query: { q: searchTerm, page: 1 },
        }}>
        Todos
      </TabNavLink>
    </PrimerTabNav>
  );
}
