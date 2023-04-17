import { Box, Button, Confetti, Content, DefaultLayout, Link, TabCoinButtons, Tooltip } from '@/TabNewsUI';
import { CommentDiscussionIcon, CommentIcon, FoldIcon, UnfoldIcon } from '@primer/octicons-react';
import { NotFoundError } from 'errors/index.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { getStaticPropsRevalidate } from 'next-swr';
import { useCollapse } from 'pages/interface';
import { useEffect, useState } from 'react';

export default function Post({ contentFound, childrenFound, rootContentFound, parentContentFound, contentMetadata }) {
  const [childrenToShow, setChildrenToShow] = useState(108);
  const [showConfetti, setShowConfetti] = useState(false);

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
            <TabCoinButtons content={contentFound} />
            <Box
              sx={{
                borderWidth: 0,
                borderRightWidth: 1,
                borderColor: 'btn.activeBorder',
                borderStyle: 'dotted',
                width: '50%',
                height: '100%',
              }}
            />
          </Box>

          <Box sx={{ width: '100%', pl: '1px', overflow: 'auto' }}>
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
              mb: 4,
              p: 4,
              wordWrap: 'break-word',
            }}>
            <Content key={contentFound.id} content={{ parent_id: contentFound.id }} mode="compact" />
          </Box>

          <RenderChildrenTree
            key={contentFound.id}
            childrenList={childrenFound}
            renderIntent={childrenToShow}
            renderIncrement={Math.ceil(childrenToShow / 2)}
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
        <Box sx={{ fontSize: 1, mb: 3, display: 'flex', flexDirection: 'row' }}>
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
              <Tooltip
                aria-label={`Este conteúdo está atualmente com status "${parentContent.status}"`}
                direction="s"
                noDelay={true}>
                <strong>{parentContent.title}</strong>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/*                   ↱ You are here
        [root]->[child]->[child]
      */}
      {content.parent_id && parentContent.id !== rootContent.id && (
        <Box sx={{ fontSize: 1, mb: 3, display: 'flex', flexDirection: 'row' }}>
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
                <strong>"{parentContent.body}..."</strong>{' '}
              </Link>
            )}
            {parentContent.status !== 'published' && (
              <Tooltip
                aria-label={`Este conteúdo está atualmente com status "${parentContent.status}"`}
                direction="s"
                noDelay={true}>
                <strong>{parentContent.body}</strong>{' '}
              </Tooltip>
            )}
            dentro da publicação{' '}
            {rootContent.status === 'published' && (
              <Link href={`/${rootContent.owner_username}/${rootContent.slug}`}>
                <strong>{rootContent.title}</strong>
              </Link>
            )}
            {rootContent.status !== 'published' && (
              <Tooltip
                aria-label={`Este conteúdo está atualmente com status "${rootContent.status}"`}
                direction="s"
                noDelay={true}>
                <strong>{rootContent.body}</strong>{' '}
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

function RenderChildrenTree({ childrenList, renderIntent, renderIncrement }) {
  const { filteredTree, handleCollapse, handleExpand } = useCollapse({ childrenList, renderIntent, renderIncrement });

  return filteredTree.map((child) => {
    const { children = [], groupedCount, id, renderIntent, renderShowMore } = child;
    const labelShowMore = Math.min(renderIncrement, groupedCount);
    const plural = labelShowMore > 1 ? 's' : '';

    return !renderIntent && !renderShowMore ? null : (
      <Box
        sx={{
          width: '100%',
          wordWrap: 'break-word',
          display: 'flex',
          mt: 4,
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
              }}>
              <TabCoinButtons content={child} />
              <Tooltip
                direction="ne"
                aria-label={`Ocultar resposta${plural}`}
                role="button"
                onClick={() => handleCollapse(id)}
                sx={{
                  cursor: 'pointer',
                  width: '80%',
                  height: '100%',
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

            <Box sx={{ width: '100%', pl: '1px', overflow: 'auto' }}>
              <Content content={child} mode="view" />

              <Box sx={{ mt: 4 }}>
                <Content content={{ parent_id: id }} mode="compact" viewFrame={true} />
              </Box>

              {children.length > 0 && (
                <RenderChildrenTree
                  childrenList={children}
                  renderIntent={renderIntent - 1}
                  renderIncrement={renderIncrement}
                />
              )}
            </Box>
          </>
        ) : (
          <Button onClick={() => handleExpand(id)} variant="invisible">
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

  try {
    context.params = validator(context.params, {
      username: 'required',
      slug: 'required',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  let contentFound;

  try {
    contentFound = await content.findOne({
      where: {
        owner_username: context.params.username,
        slug: context.params.slug,
        status: 'published',
      },
    });

    if (!contentFound) {
      throw new NotFoundError({
        message: `O conteúdo informado não foi encontrado no sistema.`,
        action: 'Verifique se o "slug" está digitado corretamente.',
        stack: new Error().stack,
        errorLocationCode: 'PAGES:USERNAME:SLUG:GET_STATIC_PROPS:SLUG_NOT_FOUND',
        key: 'slug',
      });
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
        revalidate: 1,
      };
    }

    throw error;
  }

  const secureContentFound = authorization.filterOutput(userTryingToGet, 'read:content', contentFound);

  const childrenFound = await content.findChildrenTree({
    where: {
      parent_id: contentFound.id,
    },
  });

  const secureChildrenList = authorization.filterOutput(userTryingToGet, 'read:content:list', childrenFound);

  const oneLineBody = removeMarkdown(secureContentFound.body, { maxLength: 190 });

  const contentMetadata = {
    title: `${secureContentFound.title ?? oneLineBody.substring(0, 80)} · ${secureContentFound.owner_username}`,
    image: `${webserver.host}/api/v1/contents/${secureContentFound.owner_username}/${secureContentFound.slug}/thumbnail`,
    url: `${webserver.host}/${secureContentFound.owner_username}/${secureContentFound.slug}`,
    description: oneLineBody,
    published_time: secureContentFound.published_at,
    modified_time: secureContentFound.updated_at,
    author: secureContentFound.owner_username,
    type: 'article',
  };

  let secureRootContentFound = null;
  let secureParentContentFound = null;

  if (secureContentFound.parent_id) {
    const rootContentFound = await content.findRootContent({
      where: {
        id: secureContentFound.id,
      },
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

  return {
    props: {
      contentFound: JSON.parse(JSON.stringify(secureContentFound)),
      childrenFound: JSON.parse(JSON.stringify(secureChildrenList)),
      rootContentFound: JSON.parse(JSON.stringify(secureRootContentFound)),
      parentContentFound: JSON.parse(JSON.stringify(secureParentContentFound)),
      contentMetadata: JSON.parse(JSON.stringify(contentMetadata)),
    },
    revalidate: 10,
    swr: { revalidateOnFocus: false },
  };
});
