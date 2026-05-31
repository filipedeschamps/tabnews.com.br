import { UnderlineNav as UiUnderlineNav } from '@tabnews/ui';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Children, cloneElement, isValidElement } from 'react';

import { NavList, PrimerHeader, PrimerLink } from '@/TabNewsUI';

export default NextLink;

export function Link({ href, children, ...props }) {
  return (
    <PrimerLink as={NextLink} href={href} prefetch={false} {...props}>
      {children}
    </PrimerLink>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <PrimerHeader.Link as={NextLink} href={href} prefetch={false} {...props}>
      {children}
    </PrimerHeader.Link>
  );
}

export function NavItem({ href, children, ...props }) {
  const router = useRouter();
  const isCurrent = typeof href === 'string' ? router.asPath === href : router.pathname === href.pathname;
  return (
    <NavList.Item as={NextLink} href={href} aria-current={isCurrent ? 'page' : false} prefetch={false} {...props}>
      {children}
    </NavList.Item>
  );
}

// No overflow ("Mais") o @primer/react descarta os wrappers e reconstrói cada item a partir das
// props do elemento JSX (repassando-as ao ActionList.LinkItem do menu). Por isso as props que
// precisam valer no menu têm que estar no próprio item, não dá para resolvê-las num wrapper por
// item. Injetamos aqui, no nível do nav (com um único useRouter), via cloneElement:
//   - `as={NextLink}`: sem ele o href (UrlObject) cai numa <a> comum e vira "[object Object]";
//   - `aria-current`: sem ele o Primer não destaca o item ativo nem o traz de volta para a barra
//     visível quando ele cai no menu.
export function UnderlineNav({ children, ...props }) {
  const router = useRouter();
  return (
    <UiUnderlineNav {...props}>
      {Children.map(children, (item) => {
        if (!isValidElement(item)) return item;
        const { href } = item.props;
        const isCurrent = typeof href === 'string' ? router.asPath === href : router.pathname === href.pathname;
        return cloneElement(item, { as: NextLink, prefetch: false, 'aria-current': isCurrent ? 'page' : undefined });
      })}
    </UiUnderlineNav>
  );
}

UnderlineNav.Item = UiUnderlineNav.Item;

export const UnderlineNavItem = UiUnderlineNav.Item;
