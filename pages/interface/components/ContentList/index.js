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
      }}>
      {!isLoading &&
        list?.map((contentObject) => (
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
                  {formatDistanceToNowStrict(new Date(contentObject.published_at), {
                    addSuffix: false,
                    includeSeconds: true,
                    locale: pt,
                  })}{' '}
                  atrás
                </Text>
              </Box>
            </Box>
          </Box>
        ))}
    </Box>
  );
}
