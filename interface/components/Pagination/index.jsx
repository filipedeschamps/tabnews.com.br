import { Link } from '@/TabNewsUI';
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
        <span className={classes.Muted}>
          <ChevronLeftIcon size={16} />
          Anterior
        </span>
      )}

      {nextPage ? (
        <Link href={nextPageUrl}>
          Próximo
          <ChevronRightIcon size={16} />
        </Link>
      ) : (
        <span className={classes.Muted}>
          Próximo
          <ChevronRightIcon size={16} />
        </span>
      )}
    </div>
  );
}
