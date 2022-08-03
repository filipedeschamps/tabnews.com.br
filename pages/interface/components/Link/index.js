import Link from 'next/link';
import { Link as PrimerLink } from '@primer/react';

export default function LinkComponent({ href, children, ...props }) {
  return (
    <Link href={href} passHref>
      <PrimerLink {...props}>{children}</PrimerLink>
    </Link>
  );
}
