import NextLink from 'next/link';
import { Header, Link as PrimerLink, NavList } from '@primer/react';
import { useRouter } from 'next/router';

export function Link({ href, children, ...props }) {
  return (
    <PrimerLink as={NextLink} href={href} prefetch={false} {...props}>
      {children}
    </PrimerLink>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <Header.Link as={NextLink} href={href} prefetch={false} {...props}>
      {children}
    </Header.Link>
  );
}

export default NextLink;

export function NavItem({ href, children, ...props }) {
  const { asPath, pathname } = useRouter();

  const isCurrent = typeof href === 'string' ? asPath === href : pathname === href.pathname;
  
  return (
    <NavList.Item as={NextLink} href={href} aria-current={isCurrent} prefetch={false} {...props}>
      {children}
    </NavList.Item>
  );
}
