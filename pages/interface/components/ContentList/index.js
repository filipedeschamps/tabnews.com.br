import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Box, Link, Text } from '@primer/react';
import { formatDistanceToNowStrict } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ContentList({ contentList, pagination, nextPageBasePath, revalidatePath }) {
  const listNumberOffset = pagination.perPage * (pagination.currentPage - 1);

  const { data: list } = useSWR(revalidatePath, { fallbackData: contentList, revalidateOnMount: false });

  const nextPageUrl = `${nextPageBasePath}/${pagination?.nextPage}`;

  return (
    <Box
      sx={{
        display: 'table',
        width: '100%',
      }}>
      {list.length > 0 ? <RenderItems /> : <RenderEmptyMessage />}

      {pagination?.nextPage && (
        <Box sx={{ display: 'grid', display: 'table-row' }}>
          <Box sx={{ display: 'table-cell', pr: 2, textAlign: 'right' }}>◀️</Box>
          <Box sx={{ display: 'table-cell' }}>
            <Link sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold' }} href={nextPageUrl}>
              Página anterior
            </Link>
          </Box>
        </Box>
      )}
    </Box>
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
          <Box sx={{ display: 'table-cell' }}>
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

  // TODO: Fix this, it's flickering.
  // And this was done with a `useEffect` to avoid
  // this problem: https://stackoverflow.com/questions/66374123/warning-text-content-did-not-match-server-im-out-client-im-in-div
  function PublishedSince({ date }) {
    const [publishedSinceText, setPublishedSinceText] = useState();

    useEffect(() => {
      const publishedSince = formatDistanceToNowStrict(new Date(date), {
        addSuffix: false,
        includeSeconds: true,
        locale: pt,
      });
      setPublishedSinceText(`${publishedSince} atrás`);
    }, [date]);

    return publishedSinceText;
  }

  function RenderEmptyMessage() {
    return (
      <Box sx={{ textAlign: 'center', width: '100%', mt: 10 }}>
        <Text>Nenhum conteúdo encontrado.</Text>
      </Box>
    );
  }
}
