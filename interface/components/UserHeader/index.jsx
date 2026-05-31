import { Heading, UnderlineNav, UnderlineNavItem } from '@/TabNewsUI';

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

      <UnderlineNav aria-label={`Conteúdos de ${username}`} className={classes.Nav}>
        <UnderlineNavItem href={`/${username}`}>Perfil</UnderlineNavItem>

        <UnderlineNavItem
          href={{
            pathname: '/[username]/conteudos/[page]',
            query: { username, page: 1 },
          }}
          counter={rootContentCount ? rootContentCount.toLocaleString('pt-BR') : undefined}>
          Publicações
        </UnderlineNavItem>

        <UnderlineNavItem
          href={{
            pathname: '/[username]/comentarios/[page]',
            query: { username, page: 1 },
          }}
          counter={childContentCount ? childContentCount.toLocaleString('pt-BR') : undefined}>
          Comentários
        </UnderlineNavItem>

        <UnderlineNavItem
          href={{
            pathname: '/[username]/classificados/[page]',
            query: { username, page: 1 },
          }}
          counter={adContentCount ? adContentCount.toLocaleString('pt-BR') : undefined}>
          Classificados
        </UnderlineNavItem>
      </UnderlineNav>
    </>
  );
}
