import Link from 'next/link';
import { Header, Link as PrimerLink } from '@primer/react';

export default function LinkComponent({ href, children, ...props }) {
  return (
    <Link href={href} passHref>
      <PrimerLink {...props}>{children}</PrimerLink>
    </Link>
  );
}

export function HeaderLink({ href, children, ...props }) {
  return (
    <Link href={href} passHref>
      <Header.Link {...props}>{children}</Header.Link>
    </Link>
  );
}
