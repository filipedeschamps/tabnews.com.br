import { CounterLabel, Heading, TabNav, TabNavLink } from '@/TabNewsUI';

import classes from './index.module.css';

export default function UserHeader({ username, children, rootContentCount, childContentCount, adContentCount }) {
  return (
    <>
      <div className={classes.Header}>
        <Heading as="h1" className={classes.Title}>
          {username}
        </Heading>
        {children}
      </div>

      <TabNav className={classes.Nav}>
        <TabNavLink href={`/${username}`}>Perfil</TabNavLink>

        <TabNavLink
          href={{
            pathname: '/[username]/conteudos/[page]',
            query: { username, page: 1 },
          }}>
          Publicações {!!rootContentCount && <CounterLabel>{rootContentCount.toLocaleString('pt-BR')}</CounterLabel>}
        </TabNavLink>

        <TabNavLink
          href={{
            pathname: '/[username]/comentarios/[page]',
            query: { username, page: 1 },
          }}>
          Comentários {!!childContentCount && <CounterLabel>{childContentCount.toLocaleString('pt-BR')}</CounterLabel>}
        </TabNavLink>

        <TabNavLink
          href={{
            pathname: '/[username]/classificados/[page]',
            query: { username, page: 1 },
          }}>
          Classificados {!!adContentCount && <CounterLabel>{adContentCount.toLocaleString('pt-BR')}</CounterLabel>}
        </TabNavLink>
      </TabNav>
    </>
  );
}
