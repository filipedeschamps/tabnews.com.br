import { Link, Text } from '@/TabNewsUI';
import { ChevronLeftIcon, ChevronRightIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function Pagination({ previousPage, nextPage, basePath }) {
  const previousPageUrl = `${basePath}/${previousPage}`;
  const nextPageUrl = `${basePath}/${nextPage}`;

  return (
    <div className={classes.Wrapper}>
      {previousPage ? (
        <Link href={previousPageUrl} scroll={false}>
          <ChevronLeftIcon size={16} />
          Anterior
        </Link>
      ) : (
        <Text color="fg.muted">
          <ChevronLeftIcon size={16} />
          Anterior
        </Text>
      )}

      {nextPage ? (
        <Link href={nextPageUrl}>
          Próximo
          <ChevronRightIcon size={16} />
        </Link>
      ) : (
        <Text color="fg.muted">
          Próximo
          <ChevronRightIcon size={16} />
        </Text>
      )}
    </div>
  );
}
