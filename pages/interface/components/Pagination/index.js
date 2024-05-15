import { Box, Link, Text } from '@/TabNewsUI';
import { ChevronLeftIcon, ChevronRightIcon } from '@/TabNewsUI/icons';

export default function Pagination({ previousPage, nextPage, basePath, baseQuery }) {
  const previousPageUrl = `${basePath}/${previousPage}${baseQuery ? `/${baseQuery}` : ''}`;
  const nextPageUrl = `${basePath}/${nextPage}${baseQuery ? `/${baseQuery}` : ''}`;

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        gap: 4,
        m: 4,
        mb: 2,
      }}>
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
    </Box>
  );
}
