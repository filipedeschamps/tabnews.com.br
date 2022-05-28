import useSWR from 'swr';
import { Box, Link, Text } from '@primer/react';
import PublishedSince from 'pages/interface/components/PublishedSince';

export default function ContentList({ contentList, path }) {
  const { data: list } = useSWR(path, { fallbackData: contentList });
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
        <Box as="article" key={contentObject.id} sx={{ display: 'grid', gridTemplateColumns: '30px 1fr' }}>
          <Box sx={{ mr: 2, textAlign: 'right' }}>
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

  function RenderEmptyMessage() {
    return (
      <Box sx={{ textAlign: 'center', width: '100%', mt: 10 }}>
        <Text>Nenhum conteúdo encontrado.</Text>
      </Box>
    );
  }
}
