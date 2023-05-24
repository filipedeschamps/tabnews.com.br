import { NavList, PrimerHeader, PrimerLink } from '@/TabNewsUI';
import NextLink from 'next/link';
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
    <PrimerHeader.Link as={NextLink} href={href} prefetch={false} {...props}>
      {children}
    </PrimerHeader.Link>
  );
}

export default NextLink;

export function NavItem({ href, children, ...props }) {
  const router = useRouter();
  const isCurrent = typeof href === 'string' ? router.asPath === href : router.pathname === href.pathname;
  return (
    <NavList.Item as={NextLink} href={href} aria-current={isCurrent ? 'page' : false} prefetch={false} {...props}>
      {children}
    </NavList.Item>
  );
}
