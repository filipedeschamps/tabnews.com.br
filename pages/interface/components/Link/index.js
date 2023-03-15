import NextLink from 'next/link';
import { Header, Link as PrimerLink, NavList } from '@primer/react';
import { useRouter } from 'next/router';

export function Link({ href, children, ...props }) {
  return (
    <PrimerLink as={NextLink} href={href} {...props}>
      {children}
    </PrimerLink>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <Header.Link as={NextLink} href={href} {...props}>
      {children}
    </Header.Link>
  );
}

export default NextLink;

export function NavItem({ href, children, ...props }) {
  const router = useRouter();
  const isCurrent = typeof href === 'string' ? router.asPath === href : router.pathname === href.pathname;
  return (
    <NavList.Item as={NextLink} href={href} aria-current={isCurrent ? 'page' : false} {...props}>
      {children}
    </NavList.Item>
  );
}
