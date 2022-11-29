import NextLink from 'next/link';
import { Header, Link as PrimerLink } from '@primer/react';

export function Link({ href, children, ...props }) {
  return (
    <NextLink href={href} prefetch={false} passHref {...props}>
      <PrimerLink {...props}>{children}</PrimerLink>
    </NextLink>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <NextLink href={href} prefetch={false} passHref {...props}>
      <Header.Link {...props}>{children}</Header.Link>
    </NextLink>
  );
}
