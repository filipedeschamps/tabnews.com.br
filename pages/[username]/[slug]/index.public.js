import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { Link, DefaultLayout, Content, TabCoinButtons, Confetti } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import validator from 'models/validator.js';
import authorization from 'models/authorization.js';
import removeMarkdown from 'models/remove-markdown.js';
import { NotFoundError } from 'errors/index.js';
import { Box, Tooltip } from '@primer/react';
import { CommentIcon, CommentDiscussionIcon } from '@primer/octicons-react';
import webserver from 'infra/webserver.js';

export default function Post({
  contentFound: contentFoundFallback,
  childrenFound: childrenFallback,
  rootContentFound,
  parentContentFound,
  contentMetadata,
}) {
  const { data: contentFound } = useSWR(
    `/api/v1/contents/${contentFoundFallback.owner_username}/${contentFoundFallback.slug}`,
    {
      fallbackData: contentFoundFallback,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // TODO: understand why enabling "revalidateOn..." breaks children rendering.
  const { data: children } = useSWR(
    `/api/v1/contents/${contentFoundFallback.owner_username}/${contentFoundFallback.slug}/children`,
    {
      fallbackData: childrenFallback,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
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
              pr: [0, null, null, 2],
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
            <TabCoinButtons content={contentFound} />
            <Box
              sx={{
                borderWidth: 0,
                borderRightWidth: 1,
                borderColor: 'border.muted',
                borderStyle: 'dotted',
                width: '50%',
                height: '100%',
              }}
            />
          </Box>

          <Box sx={{ width: '100%', overflow: 'auto' }}>
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

          <RenderChildrenTree key={contentFound.id} childrenList={children} level={0} />
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

function RenderChildrenTree({ childrenList, level }) {
  return childrenList.map((child) => {
    return (
      <Box
        sx={{
          width: '100%',
          wordWrap: 'break-word',
          display: 'flex',
          mt: 4,
        }}
        key={child.id}>
        <Box
          sx={{
            pr: [0, null, null, 2],
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
          <TabCoinButtons content={child} />
          <Box
            sx={{
              borderWidth: 0,
              borderRightWidth: 1,
              borderColor: 'border.muted',
              borderStyle: 'dotted',
              width: '50%',
              height: '100%',
            }}
          />
        </Box>

        <Box sx={{ width: '100%', overflow: 'auto' }}>
          <Content content={child} mode="view" />

          <Box sx={{ mt: 4 }}>
            <Content content={{ parent_id: child.id }} mode="compact" viewFrame={true} />
          </Box>

          {child.children.length > 0 && <RenderChildrenTree childrenList={child.children} level={level + 1} />}
        </Box>
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

export async function getStaticProps(context) {
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

  const webserverHost = webserver.getHost();

  const contentMetadata = {
    title: `${secureContentFound.title ?? oneLineBody.substring(0, 80)} · ${secureContentFound.owner_username}`,
    image: `${webserverHost}/api/v1/contents/${secureContentFound.owner_username}/${secureContentFound.slug}/thumbnail`,
    url: `${webserverHost}/${secureContentFound.owner_username}/${secureContentFound.slug}`,
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
  };
}
