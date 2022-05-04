import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';

export default function Home({ contentListFound }) {
  return (
    <>
      <DefaultLayout metadata={{ title: 'TabNews: Conteúdos Para Quem Trabalha Com Tecnologia' }}>
        <ContentList contentList={contentListFound} path="/api/v1/contents" />
      </DefaultLayout>
    </>
  );
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();

  const contentListFound = await content.findWithStrategy({
    strategy: 'descending',
    where: {
      parent_id: null,
      status: 'published',
    },
  });

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 1,
  };
}
