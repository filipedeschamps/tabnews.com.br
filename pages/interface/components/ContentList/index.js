import useSWR from 'swr';
import { Box, Link, Text } from '@primer/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react';

import PublishedSince from 'pages/interface/components/PublishedSince';

export default function ContentList({ contentList, pagination, paginationBasePath, revalidatePath }) {
  const listNumberOffset = pagination.perPage * (pagination.currentPage - 1);

  const { data: list } = useSWR(revalidatePath, { fallbackData: contentList, revalidateOnMount: true });

  const previousPageUrl = `${paginationBasePath}/${pagination?.previousPage}`;
  const nextPageUrl = `${paginationBasePath}/${pagination?.nextPage}`;

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: 'auto 1fr',
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
    function ChildrenDeepCountText({ count }) {
      return count !== 1 ? `${count} comentários` : `${count} comentário`;
    }

    function TabCoinsText({ count }) {
      return Math.abs(count) !== 1 ? `${count} tabcoins` : `${count} tabcoin`;
    }

    return list.map((contentObject, index) => {
      const itemCount = index + 1 + listNumberOffset;
      return [
        <Box key={itemCount} sx={{ textAlign: 'right' }}>
          <Text sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold', textAlign: 'right' }}>
            {itemCount}.
          </Text>
        </Box>,
        <Box as="article" key={contentObject.id} sx={{ overflow: 'auto' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Link
              sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold', wordWrap: 'break-word' }}
              href={`/${contentObject.username}/${contentObject.slug}`}>
              {contentObject.title}
            </Link>
          </Box>
          <Box sx={{ fontSize: 0, color: 'neutral.emphasis' }}>
            <Text>
              <TabCoinsText count={contentObject.tabcoins} />
            </Text>
            {' · '}
            <Text>
              <ChildrenDeepCountText count={contentObject.children_deep_count} />
            </Text>
            {' · '}
            <Link sx={{ color: 'neutral.emphasis' }} href={`/${contentObject.username}`}>
              {contentObject.username}
            </Link>
            {' · '}
            <Text>
              <PublishedSince date={contentObject.published_at} />
            </Text>
          </Box>
        </Box>,
      ];
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
