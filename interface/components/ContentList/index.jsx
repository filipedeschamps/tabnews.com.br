import { useEffect, useRef } from 'react';

import { AdBanner, EmptyState, Link, Pagination, PastTime, TabCoinBalanceTooltip, Tooltip } from '@/TabNewsUI';
import { CommentIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function ContentList({ ad, contentList: list, pagination, paginationBasePath, emptyStateProps }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

  useWarmNextPageOnceStale(list, pagination.nextPage, paginationBasePath);

  return (
    <>
      {list.length > 0 ? (
        <ol className={classes.List} key={`content-list-${listNumberStart}`} start={listNumberStart}>
          {ad && (
            <li className={classes.AdItem}>
              <AdBanner ad={ad} />
            </li>
          )}

          <RenderItems />

          <EndOfRelevant pagination={pagination} paginationBasePath={paginationBasePath} />
        </ol>
      ) : (
        <EmptyState title="Nenhum conteúdo encontrado" {...emptyStateProps} />
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
        <li key={contentObject.id} className={classes.Item}>
          <article>
            <div className={classes.Title}>
              {contentObject.parent_id ? (
                <Link className={classes.CommentLink} href={`/${contentObject.owner_username}/${contentObject.slug}`}>
                  <CommentIcon verticalAlign="middle" size="small" />
                  {` "${contentObject.body}"`}
                </Link>
              ) : (
                <Link className={classes.TitleLink} href={`/${contentObject.owner_username}/${contentObject.slug}`}>
                  {contentObject.title}
                </Link>
              )}
            </div>
            <div className={classes.Metadata}>
              {contentObject.type === 'ad' ? (
                <span className={classes.SponsoredText}>Patrocinado</span>
              ) : (
                <TabCoinBalanceTooltip
                  direction="ne"
                  credit={contentObject.tabcoins_credit}
                  debit={contentObject.tabcoins_debit}>
                  <TabCoinsText count={contentObject.tabcoins} />
                </TabCoinBalanceTooltip>
              )}
              {' · '}
              <span>
                <ChildrenDeepCountText count={contentObject.children_deep_count} />
              </span>
              {' · '}
              <Tooltip text={`Autor: ${contentObject.owner_username}`}>
                <address className={classes.Author}>
                  <Link className={classes.AuthorLink} href={`/${contentObject.owner_username}`}>
                    {contentObject.owner_username}
                  </Link>
                </address>
              </Tooltip>
              {' · '}
              <span>
                <PastTime direction="nw" date={contentObject.published_at} />
              </span>
            </div>
          </article>
        </li>
      );
    });
  }
}

function EndOfRelevant({ pagination, paginationBasePath }) {
  if (paginationBasePath == '/pagina' && !pagination.nextPage) {
    return (
      <div key="end-of-relevant" className={classes.EndItem}>
        <Link className={classes.TitleLink} href={'/recentes/pagina/1'}>
          <div className={classes.EndTitle}>Fim dos conteúdos relevantes mais atuais</div>
          <div className={classes.EndSubtitle}>Veja todos os conteúdos que já foram publicados na seção Recentes.</div>
        </Link>
      </div>
    );
  }

  return null;
}

// next-swr revalidates the current page shortly after mount by re-fetching it with
// `unstable_skipClientCache`, bypassing the ISR/CDN snapshot that was shown first. When that
// reveals the list was stale, the same staleness is likely present in the cached snapshot for
// the next page too, so we ping it once with a plain `fetch` — a real (non-prefetch) request is
// what makes Next.js kick off ISR's background regeneration for that page, the same way visiting
// it directly would. By the time the reader actually clicks "Próximo", that regeneration has
// usually finished, so the navigation's own fetch already comes back fresh instead of flashing
// stale content before its own revalidation kicks in. We deliberately don't use
// `router.prefetch()` here: Next.js marks prefetch requests with a `purpose: prefetch` header,
// which the framework's ISR handler treats as a cache read and never revalidates from — it would
// keep serving the same stale snapshot indefinitely. A plain `fetch` carries no such marker.
// If the current page's data never changes, we never make the extra request.
function useWarmNextPageOnceStale(list, nextPage, paginationBasePath) {
  const initialSignatureRef = useRef(getListSignature(list));
  const hasWarmedRef = useRef(false);

  useEffect(() => {
    if (hasWarmedRef.current || !nextPage) return;
    if (getListSignature(list) === initialSignatureRef.current) return;

    hasWarmedRef.current = true;
    fetch(`${paginationBasePath}/${nextPage}`).catch(() => {});
  }, [list, nextPage, paginationBasePath]);
}

function getListSignature(list) {
  return list.map((item) => item.id).join(',');
}
