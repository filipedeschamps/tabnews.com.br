import { PrimerTabNav, TabNavLink } from '@/TabNewsUI';

export default function ContentTabNav() {
  return (
    <PrimerTabNav sx={{ width: '100%', mb: 3 }}>
      <TabNavLink
        href={{
          pathname: '/recentes/todos/[page]',
          query: { page: 1 },
        }}>
        Todos Conteúdos
      </TabNavLink>
      <TabNavLink
        href={{
          pathname: '/recentes/comentarios/[page]',
          query: { page: 1 },
        }}>
        Apenas Comentários
      </TabNavLink>
    </PrimerTabNav>
  );
}
