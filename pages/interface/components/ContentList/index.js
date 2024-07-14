import { Box, EmptyState, Link, Pagination, PastTime, TabCoinBalanceTooltip, Text, Tooltip } from '@/TabNewsUI';
import { CommentIcon, LinkExternalIcon } from '@/TabNewsUI/icons';
import { getDomain, isExternalLink, isTrustedDomain } from 'pages/interface';

export default function ContentList({ ad, contentList: list, pagination, paginationBasePath, emptyStateProps }) {
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
          <Ad ad={ad} />
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

function Ad({ ad }) {
  if (!ad) {
    return;
  }

  const link = ad.source_url || `/${ad.owner_username}/${ad.slug}`;
  const isAdToExternalLink = isExternalLink(link);
  const domain = isAdToExternalLink ? `(${getDomain(link)})` : '';
  const title = ad.title.length > 70 ? ad.title.substring(0, 67).trim().concat('...') : ad.title;

  return (
    <Box as="li" sx={{ display: 'grid', gridColumnStart: 2, '::marker': 'none' }}>
      <Box>
        <Link
          sx={{
            overflow: 'auto',
            fontWeight: 'semibold',
            wordWrap: 'break-word',
            ':link': {
              color: 'success.fg',
            },
            ':visited': {
              color: 'success.fg',
            },
          }}
          href={link}
          rel={isTrustedDomain(link) ? undefined : 'nofollow'}>
          <Text sx={{ wordBreak: 'break-word', marginRight: 1 }}>
            {title} {domain}
          </Text>
          {isAdToExternalLink && <LinkExternalIcon verticalAlign="middle" />}
        </Link>
      </Box>

      <Text sx={{ whiteSpace: 'nowrap', fontSize: 0, color: 'neutral.emphasis' }}>
        Contribuindo com{' '}
        <Tooltip
          aria-label={`Autor: ${ad.owner_username}`}
          direction="nw"
          sx={{ position: 'absolute', display: 'grid' }}>
          <Link
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'neutral.emphasis', mr: 2 }}
            href={`/${ad.owner_username}`}>
            {ad.owner_username}
          </Link>
        </Tooltip>
      </Text>
    </Box>
  );
}
