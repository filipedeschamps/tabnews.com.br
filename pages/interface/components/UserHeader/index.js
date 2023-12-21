import { Box, CounterLabel, Heading, PrimerTabNav, TabNavLink } from '@/TabNewsUI';

export default function UserHeader({ username, children, rootContentCount, childContentCount }) {
  return (
    <>
      <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Heading as="h1" sx={{ wordBreak: 'break-word' }}>
          {username}
        </Heading>
        {children}
      </Box>

      <PrimerTabNav sx={{ width: '100%', mb: 3 }}>
        <TabNavLink href={`/${username}`}>Perfil</TabNavLink>

        <TabNavLink
          href={{
            pathname: '/[username]/conteudos/[page]',
            query: { username, page: 1 },
          }}>
          Publicações {!!rootContentCount && <CounterLabel>{rootContentCount}</CounterLabel>}
        </TabNavLink>

        <TabNavLink
          href={{
            pathname: '/[username]/comentarios/[page]',
            query: { username, page: 1 },
          }}>
          Comentários {!!childContentCount && <CounterLabel>{childContentCount}</CounterLabel>}
        </TabNavLink>
      </PrimerTabNav>
    </>
  );
}
