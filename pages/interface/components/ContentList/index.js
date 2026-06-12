import {
  AdBanner,
  Box,
  EmptyState,
  Link,
  NewPublicationBanner,
  Pagination,
  PastTime,
  TabCoinBalanceTooltip,
  Text,
  Tooltip,
} from '@/TabNewsUI';
import { CommentIcon } from '@/TabNewsUI/icons';

export default function ContentList({ ad, contentList: list, pagination, paginationBasePath, emptyStateProps }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

  return (
    <>
      {list.length > 0 ? (
        <Box
          as="ol"
          sx={{
            display: 'grid',
            gap: '0.8rem',
            gridTemplateColumns: 'min-content minmax(0, 1fr)',
            padding: 0,
            margin: 0,
          }}
          key={`content-list-${listNumberStart}`}
          start={listNumberStart}>
          {paginationBasePath === '/pagina' && pagination.currentPage === 1 && !pagination.previousPage && (
            <Box as="li" sx={{ display: 'block', gridColumnStart: 2, '::marker': 'none' }}>
              <NewPublicationBanner />
            </Box>
          )}
          {ad && (
            <Box as="li" sx={{ display: 'block', gridColumnStart: 2, '::marker': 'none' }}>
              <AdBanner ad={ad} />
            </Box>
          )}

          <RenderItems />

          <EndOfRelevant pagination={pagination} paginationBasePath={paginationBasePath} />
        </Box>
      ) : (
        <EmptyState title="Nenhum conteúdo encontrado" {...emptyStateProps} />
      )}

      {list.length > 0 ? <Pagination {...pagination} basePath={paginationBasePath} /> : null}
    </>
  );

  function RenderItems() {
    function ChildrenDeepCountText({ count, isParent, contentObject }) {
      const visualCount = isParent ? count : contentObject.children_deep_count > 1 ? count - 1 : 0;

      const countPrefix = visualCount > 1 ? 'mais' : '';
      const countSufix = visualCount > 1 ? 'comentários' : 'comentário';

      if (visualCount === 0) return 'sem mais comentários';
      else return `${countPrefix} ${visualCount} ${countSufix}`;
    }

    function TabCoinsText({ count }) {
      return count > 1 || count < -1 ? `${count} tabcoins` : `${count} tabcoin`;
    }

    return list.map((contentObject) => {
      return (
        <Box
          key={contentObject.id}
          sx={{
            display: 'contents',
            ':before': {
              content: 'counter(list-item) "."',
              counterIncrement: 'list-item',
              fontWeight: 'semibold',
              marginLeft: 5,
            },
          }}>
          <Box as="article">
            <Box
              sx={{
                overflow: 'auto',
                fontWeight: 'semibold',
                fontSize: 2,
                '> a': {
                  ':link': {
                    color: 'fg.default',
                  },
                  ':visited': {
                    color: 'fg.subtle',
                  },
                },
              }}>
              {contentObject.parent_id ? (
                <Link
                  sx={{ wordWrap: 'break-word', fontStyle: 'italic', fontWeight: 'normal' }}
                  href={`/${contentObject.owner_username}/${contentObject.slug}`}>
                  <CommentIcon verticalAlign="middle" size="small" />
                  {` "${contentObject.body}"`}
                </Link>
              ) : (
                <Link sx={{ wordWrap: 'break-word' }} href={`/${contentObject.owner_username}/${contentObject.slug}`}>
                  {contentObject.title}
                </Link>
              )}
            </Box>
            {!contentObject.parent_id && contentObject.children_deep_count > 0 && contentObject.top_comment_body && (
              <Box
                sx={{
                  fontSize: 0,
                  marginTop: 1,
                  paddingLeft: 2,
                  marginLeft: 1,
                  color: 'neutral.emphasis',
                  borderColor: 'neutral.emphasis',
                  borderLeft: '1px solid',
                  flexDirection: 'column',
                }}>
                <Link
                  sx={{ wordWrap: 'break-word', fontStyle: 'italic', fontWeight: 'normal', color: 'fg.subtle' }}
                  href={`/${contentObject.owner_username}/${contentObject.slug}`}>
                  <CommentIcon verticalAlign="middle" size={11} />
                  {` "${contentObject.top_comment_body.slice(0, 250) ?? contentObject.body.slice(0, 250) ?? ''}..."`}
                </Link>
              </Box>
            )}
            <Box
              sx={{
                display: 'grid',
                marginTop:
                  !contentObject.parent_id && contentObject.children_deep_count > 0 && contentObject.top_comment_body
                    ? 1
                    : 0,
                gap: 1,
                gridTemplateColumns:
                  'max-content max-content max-content max-content minmax(20px, max-content) max-content max-content',
                fontSize: 0,
                whiteSpace: 'nowrap',
                color: 'neutral.emphasis',
              }}>
              {contentObject.type === 'ad' ? (
                <Text sx={{ color: 'success.fg' }}>Patrocinado</Text>
              ) : (
                <TabCoinBalanceTooltip
                  direction="ne"
                  credit={contentObject.tabcoins_credit}
                  debit={contentObject.tabcoins_debit}>
                  <TabCoinsText count={contentObject.tabcoins} />
                </TabCoinBalanceTooltip>
              )}
              {' · '}
              <Text>
                <ChildrenDeepCountText
                  count={contentObject.children_deep_count}
                  isParent={Boolean(contentObject.parent_id)}
                  contentObject={contentObject}
                />
              </Text>
              {' · '}

              <Tooltip text={`Autor: ${contentObject.owner_username}`}>
                <Text as="address" sx={{ fontStyle: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Link sx={{ color: 'neutral.emphasis' }} href={`/${contentObject.owner_username}`}>
                    {contentObject.owner_username}
                  </Link>
                </Text>
              </Tooltip>
              {' · '}
              <Text>
                <PastTime direction="nw" date={contentObject.published_at} />
              </Text>
            </Box>
          </Box>
        </Box>
      );
    });
  }
}

function EndOfRelevant({ pagination, paginationBasePath }) {
  if (paginationBasePath == '/pagina' && !pagination.nextPage) {
    return (
      <Box key="end-of-relevant" sx={{ gridColumnStart: 2 }}>
        <Link sx={{ wordWrap: 'break-word' }} href={'/recentes/pagina/1'}>
          <Box
            sx={{
              overflow: 'auto',
              fontWeight: 'semibold',
              fontSize: 2,
            }}>
            Fim dos conteúdos relevantes mais atuais
          </Box>
          <Box sx={{ fontSize: 0 }}>Veja todos os conteúdos que já foram publicados na seção Recentes.</Box>
        </Link>
      </Box>
    );
  }

  return null;
}
