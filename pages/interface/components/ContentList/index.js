import { Box, EmptyState, Link, Pagination, PastTime, TabCoinBalanceTooltip, Text, Tooltip } from '@/TabNewsUI';
import { CommentIcon } from '@/TabNewsUI/icons';

export default function ContentList({ contentList: list, pagination, paginationBasePath, emptyStateProps }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

  return (
    <>
      {list.length > 0 ? (
        <Box
          as="ol"
          sx={{
            display: 'grid',
            gap: '0.5rem',
            gridTemplateColumns: 'min-content minmax(0, 1fr)',
            padding: 0,
            margin: 0,
          }}
          key={`content-list-${listNumberStart}`}
          start={listNumberStart}>
          <RenderItems />
          <EndOfRelevant />
        </Box>
      ) : (
        <RenderEmptyMessage {...emptyStateProps} />
      )}

      {list.length > 0 ? <Pagination {...pagination} basePath={paginationBasePath} /> : null}
    </>
  );

  function RenderItems() {
    function ChildrenDeepCountText({ count }) {
      return count > 1 ? `${count} comentários` : `${count} comentário`;
    }

    function TabCoinsText({ count }) {
      return count > 1 || count < -1 ? `${count} tabcoins` : `${count} tabcoin`;
    }

    return list.map((contentObject) => {
      return (
        <Box
          key={contentObject.id}
          as="li"
          sx={{
            display: 'contents',
            ':before': {
              content: 'counter(list-item) "."',
              counterIncrement: 'list-item',
              fontWeight: 'semibold',
              width: 'min-content',
              marginLeft: 'auto',
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
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns:
                  'max-content max-content max-content max-content minmax(20px, max-content) max-content max-content',
                fontSize: 0,
                whiteSpace: 'nowrap',
                color: 'neutral.emphasis',
              }}>
              <TabCoinBalanceTooltip
                direction="ne"
                credit={contentObject.tabcoins_credit}
                debit={contentObject.tabcoins_debit}>
                <TabCoinsText count={contentObject.tabcoins} />
              </TabCoinBalanceTooltip>
              {' · '}
              <Text>
                <ChildrenDeepCountText count={contentObject.children_deep_count} />
              </Text>
              {' · '}
              <Tooltip aria-label={`Autor: ${contentObject.owner_username}`}>
                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Text as="address" sx={{ fontStyle: 'normal' }}>
                    <Link sx={{ color: 'neutral.emphasis' }} href={`/${contentObject.owner_username}`}>
                      {contentObject.owner_username}
                    </Link>
                  </Text>
                </Box>
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

  function EndOfRelevant() {
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

  function RenderEmptyMessage(props) {
    return <EmptyState title="Nenhum conteúdo encontrado" {...props} />;
  }
}
