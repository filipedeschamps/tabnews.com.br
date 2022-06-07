import useSWR from 'swr';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { DefaultLayout, Content } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import validator from 'models/validator.js';
import authorization from 'models/authorization.js';
import { NotFoundError } from 'errors/index.js';
import { Box, Link } from '@primer/react';

export default function Post({ contentFound: contentFoundFallback, childrenFound: childrenFallback }) {
  const { data: contentFound } = useSWR(
    `/api/v1/contents/${contentFoundFallback.username}/${contentFoundFallback.slug}`,
    {
      fallbackData: contentFoundFallback,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // TODO: understand why enabling "revalidateOn..." breaks children rendering.
  const { data: children } = useSWR(
    `/api/v1/contents/${contentFoundFallback.username}/${contentFoundFallback.slug}/children`,
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
      <DefaultLayout content={contentFound}>
        {contentFound.parent_slug && (
          <Box sx={{ fontSize: 1, mb: 3 }}>
            Em resposta a{' '}
            <Link href={`/${contentFound.parent_username}/${contentFound.parent_slug}`}>
              <strong>
                {contentFound.parent_title
                  ? contentFound.parent_title
                  : `/${contentFound.parent_username}/${contentFound.parent_slug}`}
              </strong>
            </Link>
          </Box>
        )}
        <Box
          sx={{
            width: '100%',
            borderRadius: '6px',
            borderWidth: 1,
            borderColor: 'border.default',
            borderStyle: 'solid',
            padding: 4,
            wordWrap: 'break-word',
          }}>
          <Content content={contentFound} mode="view" />
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

function RenderChildrenTree({ childrenList, level }) {
  return childrenList.map((child) => {
    return (
      <Box
        sx={{
          maxWidth: '100%',
          borderRadius: '6px',
          borderWidth: 1,
          borderColor: 'border.default',
          borderStyle: 'solid',
          mt: 4,
          p: 4,
          wordWrap: 'break-word',
        }}
        key={child.id}>
        <Content content={child} mode="view" />

        <Box
          sx={{
            mt: 4,
          }}>
          <Content content={{ parent_id: child.id }} mode="compact" viewFrame={true} />
        </Box>

        {child.children.length > 0 && <RenderChildrenTree childrenList={child.children} level={level + 1} />}
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
    };
  }

  let contentFound;

  try {
    contentFound = await content.findOne({
      where: {
        username: context.params.username,
        slug: context.params.slug,
        status: 'published',
      },
    });

    if (!contentFound) {
      throw new NotFoundError({
        message: `O conteúdo informado não foi encontrado no sistema.`,
        action: 'Verifique se o "slug" está digitado corretamente.',
        stack: new Error().stack,
        errorUniqueCode: 'PAGES:USERNAME:SLUG:GET_STATIC_PROPS:SLUG_NOT_FOUND',
        key: 'slug',
      });
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
      };
    }

    throw error;
  }

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content', contentFound);

  const childrenFound = await content.findChildrenTree({
    where: {
      parent_id: contentFound.id,
    },
  });

  const secureChildrenList = authorization.filterOutput(userTryingToGet, 'read:content:list', childrenFound);

  return {
    props: {
      contentFound: JSON.parse(JSON.stringify(secureContentValues)),
      childrenFound: JSON.parse(JSON.stringify(secureChildrenList)),
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 1,
  };
}
