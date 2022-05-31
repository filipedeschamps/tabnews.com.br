import useSWR from 'swr';
import { Box, Link, Text } from '@primer/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react';

import PublishedSince from 'pages/interface/components/PublishedSince';

export default function ContentList({ contentList, pagination, paginationBasePath, revalidatePath }) {
  const listNumberOffset = pagination.perPage * (pagination.currentPage - 1);

  const { data: list } = useSWR(revalidatePath, { fallbackData: contentList, revalidateOnMount: false });

  const previousPageUrl = `${paginationBasePath}/${pagination?.previousPage}`;
  const nextPageUrl = `${paginationBasePath}/${pagination?.nextPage}`;

  return (
    <>
      <Box
        sx={{
          display: 'table',
          borderSpacing: '0 0.5rem',
        }}>
        {list.length > 0 ? <RenderItems /> : <RenderEmptyMessage />}
      </Box>

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
          gap: 4,
          m: 4,
        }}>
        {pagination.previousPage ? (
          <Link href={previousPageUrl}>
            <ChevronLeftIcon size={16} />
            Anterior
          </Link>
        ) : (
          <Text color="fg.muted">
            <ChevronLeftIcon size={16} />
            Anterior
          </Text>
        )}

        {pagination.nextPage ? (
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
    </>
  );

  function RenderItems() {
    return list.map((contentObject, index) => {
      const itemCount = index + 1 + listNumberOffset;
      return (
        <Box as="article" key={contentObject.id} sx={{ display: 'table-row' }}>
          <Box sx={{ display: 'table-cell', pr: 2, textAlign: 'right' }}>
            <Text sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold', textAlign: 'right' }}>
              {itemCount}.
            </Text>
          </Box>
          <Box sx={{ display: 'table-cell', lineHeight: '20px' }}>
            <Box>
              <Link
                sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold' }}
                href={`/${contentObject.username}/${contentObject.slug}`}>
                {contentObject.title}
              </Link>
            </Box>
            <Box>
              <Link sx={{ fontSize: 0, color: 'neutral.emphasis', mr: 1 }} href={`/${contentObject.username}`}>
                {contentObject.username}
              </Link>
              <Text
                sx={{ fontSize: 0, color: 'neutral.emphasis' }}
                href={`/${contentObject.username}/${contentObject.slug}`}>
                <PublishedSince date={contentObject.published_at} />
              </Text>
            </Box>
          </Box>
        </Box>
      );
    });
  }

  function RenderEmptyMessage() {
    return (
      <Box sx={{ textAlign: 'center', width: '100%', mt: 10 }}>
        <Text>Nenhum conteúdo encontrado.</Text>
      </Box>
    );
  }
}
