import { AdBanner, EmptyState, Link, Pagination, PastTime, TabCoinBalanceTooltip, Tooltip } from '@/TabNewsUI';
import { CommentIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function ContentList({ ad, contentList: list, pagination, paginationBasePath, emptyStateProps }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

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
