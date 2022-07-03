import useSWR from 'swr';
import { Box, Link, Text, Truncate } from '@primer/react';
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
        width={'100%'}
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}>
        {list.length > 0 ? <RenderItems /> : <RenderEmptyMessage />}
      </Box>

      {list.length > 0 && (
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
      )}
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
      return (
        <Box
          mb={2}
          maxWidth={'100vw'}
          borderRadius={5}
          as="article"
          key={contentObject.id}
          borderColor="border.default"
          borderWidth={1}
          borderStyle="solid"
          display={'flex'}
          flexDirection={'row'}>
          <Box
            p={3}
            borderRight={'1px #d0d7de solid'}
            maxWidth={'6vw'}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}>
            <Text sx={{ fontSize: 2, color: 'fg.subtle', fontWeight: 'semibold' }}>{itemCount}</Text>
          </Box>
          <Box
            p={3}
            width={'100%'}
            maxWidth={'85vw'}
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}>
            <Box>
              <Truncate as="text" inline maxWidth={'85%'}>
                <Link
                  muted
                  sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'bold' }}
                  href={`/${contentObject.username}/${contentObject.slug}`}>
                  {contentObject.title}
                </Link>
              </Truncate>
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
              <Link sx={{ color: 'neutral.emphasis', mr: 1 }} href={`/${contentObject.username}`}>
                {contentObject.username}
              </Link>
              <Text>
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
