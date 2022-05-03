import { Box, Text } from '@primer/react';
import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { NotFoundError } from 'errors/index.js';

export default function Home({ contentListFound, username }) {
  return (
    <>
      <DefaultLayout metadata={{ title: `${username}` }}>
        <ContentList contentList={contentListFound} path={`/api/v1/contents/${username}`} />
      </DefaultLayout>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();

  context.params = validator(context.params, {
    username: 'required',
  });

  let contentListFound;

  try {
    contentListFound = await content.findAll({
      where: {
        username: context.params.username,
        parent_id: null,
        status: 'published',
      },
      order: 'published_at DESC',
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
      };
    }

    throw error;
  }

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      username: context.params.username,
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 1,
  };
}
