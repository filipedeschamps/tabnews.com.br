import { truncate } from '@tabnews/helpers';
import { getStaticPropsRevalidate } from 'next-swr';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { AdBanner, Box, Button, Confetti, Content, DefaultLayout, Link, TabCoinButtons, Tooltip } from '@/TabNewsUI';
import { CommentDiscussionIcon, CommentIcon, FoldIcon, UnfoldIcon } from '@/TabNewsUI/icons';
import { NotFoundError, ValidationError } from 'errors';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown.js';
import user from 'models/user.js';
import { useCollapse } from 'pages/interface';

export default function Post({ contentFound, rootContentFound, parentContentFound, contentMetadata }) {
  const [childrenToShow, setChildrenToShow] = useState(108);
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    data: { body: adsFound },
    isLoading: isLoadingAd,
  } = useSWR(
    `/api/v1/sponsored-beta?per_page=1&ignore_id=${contentFound.id}&owner_id=${contentFound.owner_id}&flexible=${contentFound.type === 'content'}`,
    {
      fallbackData: { body: [], headers: {} },
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    setChildrenToShow(Math.ceil(window.innerHeight / 10));

    const justPublishedNewRootContent = localStorage.getItem('justPublishedNewRootContent');

    if (justPublishedNewRootContent) {
      setShowConfetti(true);
      localStorage.removeItem('justPublishedNewRootContent');
    }
  }, []);

  return (
    <>
      {showConfetti && <Confetti />}
      <DefaultLayout metadata={contentMetadata}>
        <InReplyToLinks content={contentFound} parentContent={parentContentFound} rootContent={rootContentFound} />

        <Box
          sx={{
            width: '100%',
            display: 'flex',
          }}>
          <Box
            sx={{
              pr: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
            <TabCoinButtons key={contentFound.id} content={contentFound} />
            <Box
              sx={{
                borderWidth: 0,
                borderRightWidth: 1,
                borderColor: 'btn.activeBorder',
                borderStyle: 'dotted',
                width: '50%',
                height: '100%',
                minHeight: '8px',
              }}
            />
          </Box>

          <Box sx={{ width: '100%', mt: contentFound.title ? 0 : '9px', pl: '1px', overflow: 'auto' }}>
            <Content key={contentFound.id} content={contentFound} mode="view" />
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              borderRadius: '6px',
              borderWidth: 1,
              borderColor: 'border.default',
              borderStyle: 'solid',
              mt: 4,
              mb: 3,
              p: 4,
              wordWrap: 'break-word',
            }}>
            <Content
              key={contentFound.id}
              content={{
                owner_id: contentFound.owner_id,
                owner_username: contentFound.owner_username,
                parent_id: contentFound.id,
                slug: contentFound.slug,
              }}
              rootContent={rootContentFound || contentFound}
              mode="compact"
            />
          </Box>

          <AdBanner ad={adsFound[0]} isLoading={isLoadingAd} sx={{ ml: 5, pl: 1 }} />

          <RenderChildrenTree
            key={contentFound.id}
            childrenDeepCount={contentFound.children_deep_count}
            childrenList={contentFound.children}
            pageRootOwnerId={contentFound.owner_id}
            renderIntent={childrenToShow}
            renderIncrement={Math.ceil(childrenToShow / 2)}
            rootContent={rootContentFound || contentFound}
          />
        </Box>
      </DefaultLayout>
    </>
  );
}

function InReplyToLinks({ content, parentContent, rootContent }) {
  return (
    <>
      {/*          ↱ You are here
        [root]->[child]->[child]
      */}
      {content.parent_id && parentContent.id === rootContent.id && (
        <Box sx={{ fontSize: 1, mb: 2, display: 'flex', flexDirection: 'row' }}>
          <Box
            sx={{
              textAlign: 'center',
              pl: ['6px', null, null, '6px'],
              pr: ['6px', null, null, '13px'],
            }}>
            <CommentIcon verticalAlign="middle" size="small" />
          </Box>
          <Box>
            Em resposta a{' '}
            {parentContent.status === 'published' && (
              <Link href={`/${parentContent.owner_username}/${parentContent.slug}`}>
                <strong>{parentContent.title}</strong>
              </Link>
            )}
            {parentContent.status !== 'published' && (
              <Tooltip text={`Este conteúdo está atualmente com status "${parentContent.status}"`} direction="s">
                <strong>[Não disponível]</strong>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/*                   ↱ You are here
        [root]->[child]->[child]
      */}
      {content.parent_id && parentContent.id !== rootContent.id && (
        <Box sx={{ fontSize: 1, mb: 2, display: 'flex', flexDirection: 'row' }}>
          <Box
            sx={{
              textAlign: 'center',
              pl: ['6px', null, null, '6px'],
              pr: ['6px', null, null, '13px'],
            }}>
            <CommentDiscussionIcon verticalAlign="middle" size="small" />
          </Box>
          <Box>
            Respondendo a{' '}
            {parentContent.status === 'published' && (
              <Link href={`/${parentContent.owner_username}/${parentContent.slug}`}>
                <strong>{`"${parentContent.body}"`}</strong>
              </Link>
            )}
            {parentContent.status !== 'published' && (
              <Tooltip text={`Este conteúdo está atualmente com status "${parentContent.status}"`} direction="s">
                <strong>[Não disponível]</strong>
              </Tooltip>
            )}
            {' dentro da publicação '}
            {rootContent.status === 'published' && (
              <Link href={`/${rootContent.owner_username}/${rootContent.slug}`}>
                <strong>{rootContent.title}</strong>
              </Link>
            )}
            {rootContent.status !== 'published' && (
              <Tooltip text={`Este conteúdo está atualmente com status "${rootContent.status}"`} direction="s">
                <strong>[Não disponível]</strong>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

function RenderChildrenTree({ childrenList, pageRootOwnerId, renderIntent, renderIncrement, rootContent }) {
  const { childrenState, handleCollapse, handleExpand } = useCollapse({ childrenList, renderIntent, renderIncrement });

  return childrenState.map((child) => {
    const {
      children,
      children_deep_count,
      groupedCount,
      id,
      owner_id,
      owner_username,
      renderIntent,
      renderShowMore,
      slug,
      status,
    } = child;
    const isPublished = status === 'published';
    const labelShowMore = Math.min(groupedCount, renderIncrement) || '';
    const plural = labelShowMore != 1 ? 's' : '';
    const isPageRootOwner = pageRootOwnerId === owner_id;

    if (!renderIntent && !renderShowMore) return null;
    if (!isPublished && !children_deep_count) return null;

    return (
      <Box
        sx={{
          width: '100%',
          wordWrap: 'break-word',
          display: 'flex',
          mt: 3,
        }}
        key={id}>
        {renderIntent ? (
          <>
            <Box
              sx={{
                mr: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '28px',
              }}>
              <TabCoinButtons content={child} />
              <Tooltip
                direction="ne"
                text={`Ocultar resposta${plural}`}
                role="button"
                onClick={() => handleCollapse(id)}
                sx={{
                  cursor: 'pointer',
                  width: '80%',
                  height: '100%',
                  minHeight: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 1,
                  mx: '10%',
                  '&:hover': {
                    div: {
                      display: 'block',
                      borderLeftWidth: 1,
                      borderColor: 'btn.danger.hoverBg',
                      borderStyle: 'dashed',
                    },
                    svg: {
                      backgroundColor: 'canvas.default',
                    },
                  },
                }}>
                <Box
                  sx={{
                    display: 'none',
                    position: 'relative',
                    width: '0%',
                    left: '-7px',
                    color: 'btn.danger.hoverBg',
                    borderStyle: 'hidden!important',
                  }}>
                  <FoldIcon />
                </Box>
                <Box
                  sx={{
                    borderWidth: 0,
                    borderRightWidth: 1,
                    borderLeftWidth: 0,
                    borderColor: 'btn.activeBorder',
                    borderStyle: 'dotted',
                    width: 0,
                    transition: 'border 0.1s cubic-bezier(1,1,1,0)',
                  }}
                />
              </Tooltip>
            </Box>

            <Box
              sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: '9px', pl: '1px', overflow: 'auto' }}>
              {isPublished && <Content content={child} isPageRootOwner={isPageRootOwner} mode="view" />}

              <Box sx={{ display: 'flex', flex: 1, mt: isPublished ? 4 : 0, alignItems: 'end' }}>
                <Content
                  content={{ owner_id, owner_username, parent_id: id, slug }}
                  mode={isPublished ? 'compact' : 'deleted'}
                  rootContent={rootContent}
                  viewFrame={true}
                />
              </Box>

              {children_deep_count > 0 && (
                <RenderChildrenTree
                  childrenDeepCount={children_deep_count}
                  childrenList={children}
                  pageRootOwnerId={pageRootOwnerId}
                  renderIntent={renderIntent - 1}
                  renderIncrement={renderIncrement}
                  rootContent={rootContent}
                />
              )}
            </Box>
          </>
        ) : (
          <Button onClick={() => handleExpand(id)} variant="invisible" sx={{ color: 'accent.fg' }}>
            <UnfoldIcon /> {`Ver mais ${labelShowMore} resposta${plural}`}
            {labelShowMore != groupedCount && ` (${groupedCount} ocultas)`}
          </Button>
        )}
      </Box>
    );
  });
}

export async function getStaticPaths() {
  const relevantResults = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: 1,
    per_page: 100,
  });

  const paths = relevantResults.rows.map((content) => {
    return {
      params: {
        username: content.owner_username,
        slug: content.slug,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
}

export const getStaticProps = getStaticPropsRevalidate(async (context) => {
  const userTryingToGet = user.createAnonymous();

  let contentTreeFound;

  try {
    contentTreeFound = await content.findTree({
      where: {
        owner_username: context.params.username,
        slug: context.params.slug,
      },
    });

    if (!contentTreeFound?.length) {
      throw new NotFoundError({
        message: `O conteúdo informado não foi encontrado no sistema.`,
        action: 'Verifique se o "slug" está digitado corretamente.',
        stack: new Error().stack,
        errorLocationCode: 'PAGES:USERNAME:SLUG:GET_STATIC_PROPS:SLUG_NOT_FOUND',
        key: 'slug',
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        notFound: true,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        notFound: true,
        revalidate: 1,
      };
    }

    throw error;
  }

  const secureContentTree = authorization.filterOutput(userTryingToGet, 'read:content:list', contentTreeFound);

  const secureContentFound = secureContentTree[0];

  const oneLineBody = removeMarkdown(secureContentFound.body, { maxLength: 190 });

  const contentMetadata = {
    title: `${secureContentFound.title ?? truncate(oneLineBody, 80)} · ${secureContentFound.owner_username}`,
    image: `${webserver.host}/api/v1/contents/${secureContentFound.owner_username}/${secureContentFound.slug}/thumbnail`,
    url: `${webserver.host}/${secureContentFound.owner_username}/${secureContentFound.slug}`,
    description: oneLineBody,
    published_time: secureContentFound.published_at,
    modified_time: secureContentFound.updated_at,
    author: secureContentFound.owner_username,
    type: 'article',
    canonical: secureContentFound.parent_id
      ? undefined
      : `${webserver.host}/${secureContentFound.owner_username}/${secureContentFound.slug}`,
    noIndex: secureContentFound.type === 'ad',
  };

  let secureRootContentFound = null;
  let secureParentContentFound = null;

  if (contentTreeFound[0].path.length > 1) {
    const rootContentFound = await content.findOne({
      where: {
        id: contentTreeFound[0].path[0],
      },
      attributes: { exclude: ['body'] },
    });

    secureRootContentFound = authorization.filterOutput(userTryingToGet, 'read:content', rootContentFound);

    const parentContentFound = await content.findOne({
      where: {
        id: secureContentFound.parent_id,
      },
    });

    parentContentFound.body = removeMarkdown(parentContentFound.body, { maxLength: 50 });
    secureParentContentFound = authorization.filterOutput(userTryingToGet, 'read:content', parentContentFound);
  }

  if (contentTreeFound[0].path.length === 1) {
    const parentContentFound = await content.findOne({
      where: {
        id: secureContentFound.parent_id,
      },
      attributes: { exclude: ['body'] },
    });

    secureParentContentFound = authorization.filterOutput(userTryingToGet, 'read:content', parentContentFound);

    secureRootContentFound = { id: secureParentContentFound.id, title: secureParentContentFound.title };
  }

  return {
    props: {
      contentFound: JSON.parse(JSON.stringify(secureContentFound)),
      rootContentFound: JSON.parse(JSON.stringify(secureRootContentFound)),
      parentContentFound: JSON.parse(JSON.stringify(secureParentContentFound)),
      contentMetadata: JSON.parse(JSON.stringify(contentMetadata)),
    },
    revalidate: 1,
    swr: { revalidateOnFocus: false },
  };
});
