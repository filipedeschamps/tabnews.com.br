import useSWR from 'swr';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Link, DefaultLayout, Content, TabCoinButtons } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import validator from 'models/validator.js';
import authorization from 'models/authorization.js';
import removeMarkdown from 'models/remove-markdown.js';
import { NotFoundError } from 'errors/index.js';
import { Box } from '@primer/react';
import { CommentIcon, CommentDiscussionIcon } from '@primer/octicons-react';
import webserver from 'infra/webserver.js';

export default function Post({
  contentFound: contentFoundFallback,
  childrenFound: childrenFallback,
  contentMetadata,
  rootContentFound,
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

  const [confettiWidth, setConfettiWidth] = useState(0);
  const [confettiHeight, setConfettiHeight] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    function handleResize() {
      setConfettiWidth(window.screen.width);
      setConfettiHeight(window.screen.height);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    const justPublishedNewRootContent = localStorage.getItem('justPublishedNewRootContent');

    if (justPublishedNewRootContent) {
      setShowConfetti(true);
      localStorage.removeItem('justPublishedNewRootContent');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={confettiWidth}
          height={confettiHeight}
          recycle={false}
          numberOfPieces={800}
          tweenDuration={15000}
          gravity={0.15}
        />
      )}
      <DefaultLayout metadata={contentMetadata}>
        <InReplyToLinks rootContent={rootContentFound} content={contentFound} />

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
                borderColor: 'border.muted',
                borderStyle: 'dotted',
                width: '50%',
                height: '100%',
              }}
            />
          </Box>

          {/* 36px is the size of the TabCoin column */}
          <Box sx={{ width: 'calc(100% - 36px)' }}>
            <Content content={contentFound} mode="view" />
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
            <Content content={{ parent_id: contentFound.id }} mode="compact" />
          </Box>

          <RenderChildrenTree childrenList={children} level={0} />
        </Box>
      </DefaultLayout>
    </>
  );
}

function InReplyToLinks({ rootContent, content }) {
  return (
    <>
      {content.parent_id && rootContent.id === content.parent_id && (
        <Box sx={{ fontSize: 1, mb: 3, display: 'flex', flexDirection: 'row' }}>
          <Box sx={{ pl: '6px', pr: '14px' }}>
            <CommentIcon verticalAlign="middle" size="small" />
          </Box>
          <Box>
            Em resposta a{' '}
            <Link href={`/${content.parent_username}/${content.parent_slug}`}>
              <strong>
                {content.parent_title ? content.parent_title : `/${content.parent_username}/${content.parent_slug}`}
              </strong>
            </Link>
          </Box>
        </Box>
      )}

      {content.parent_id && rootContent.id !== content.parent_id && (
        <Box sx={{ fontSize: 1, mb: 3, display: 'flex', flexDirection: 'row' }}>
          <Box sx={{ pl: '7px', pr: '13px' }}>
            <CommentDiscussionIcon verticalAlign="middle" size="small" />
          </Box>
          <Box>
            Respondendo a{' '}
            <Link href={`/${content.parent_username}/${content.parent_slug}`}>
              <strong>este comentário</strong>
            </Link>{' '}
            dentro da publicação{' '}
            <Link href={`/${rootContent.owner_username}/${rootContent.slug}`}>
              <strong>{rootContent.title}</strong>
            </Link>
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
            pr: 2,
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

        {/* 36px is the size of the TabCoin column */}
        <Box sx={{ width: 'calc(100% - 36px)' }}>
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
  return {
    paths: [],
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
      revalidate: 1,
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

  const oneLineBody = removeMarkdown(secureContentFound.body).replace(/\s+/g, ' ');

  const webserverHost = webserver.getHost();

  const contentMetadata = {
    title: `${secureContentFound.title ?? oneLineBody.substring(0, 80)} · ${secureContentFound.owner_username}`,
    image: `${webserverHost}/api/v1/contents/${secureContentFound.owner_username}/${secureContentFound.slug}/thumbnail`,
    url: `${webserverHost}/${secureContentFound.owner_username}/${secureContentFound.slug}`,
    description: oneLineBody.substring(0, 190),
    published_time: secureContentFound.published_at,
    modified_time: secureContentFound.updated_at,
    author: secureContentFound.owner_username,
    type: 'article',
  };

  let secureContentRootFound = null;

  if (secureContentFound.parent_id) {
    const rootContentFound = await content.findRootContent({
      where: {
        id: secureContentFound.id,
      },
    });

    if (rootContentFound) {
      secureContentRootFound = authorization.filterOutput(userTryingToGet, 'read:content', rootContentFound);
    }
  }

  return {
    props: {
      contentFound: JSON.parse(JSON.stringify(secureContentFound)),
      childrenFound: JSON.parse(JSON.stringify(secureChildrenList)),
      contentMetadata: JSON.parse(JSON.stringify(contentMetadata)),
      rootContentFound: JSON.parse(JSON.stringify(secureContentRootFound)),
    },
    revalidate: 1,
  };
}
