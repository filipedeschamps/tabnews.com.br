import NextLink from 'next/link';
import { Header, Link as PrimerLink } from '@primer/react';

export function Link({ href, children, ...props }) {
  return (
    <PrimerLink as={NextLink} href={href} {...props} prefetch={false}>
      {children}
    </PrimerLink>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <Header.Link as={NextLink} href={href} {...props} prefetch={false}>
      {children}
    </Header.Link>
  );
}

export default NextLink;
