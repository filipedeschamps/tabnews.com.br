import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Box, Link, Text } from '@primer/react';
import { formatDistanceToNowStrict } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ContentList({ contentList, path }) {
  const { data: list, isLoading } = useSWR(path, { fallbackData: contentList });

  let count = 1;
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        width: '100%',
      }}>
      {list.length > 0 ? <RenderItems /> : <RenderEmptyMessage />}
    </Box>
  );

  function RenderItems() {
    return list.map((contentObject) => {
      return (
        <Box key={contentObject.id} sx={{ display: 'flex' }}>
          <Box sx={{ mr: 2, width: '20px', textAlign: 'right' }}>
            <Text sx={{ fontSize: 2, color: 'fg.default', fontWeight: 'semibold' }}>{count++}.</Text>
          </Box>
          <Box>
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
