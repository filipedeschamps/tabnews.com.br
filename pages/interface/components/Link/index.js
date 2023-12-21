import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { NavList, PrimerHeader, PrimerLink, PrimerTabNav } from '@/TabNewsUI';

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

export function TabNavLink({ href, children, ...props }) {
  const router = useRouter();
  const isCurrent = typeof href === 'string' ? router.asPath === href : router.pathname === href.pathname;
  return (
    <PrimerTabNav.Link as={NextLink} href={href} selected={isCurrent} prefetch={false} {...props}>
      {children}
    </PrimerTabNav.Link>
  );
}
