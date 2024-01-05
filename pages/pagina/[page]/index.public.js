import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout } from '@/TabNewsUI';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function Home({ contentListFound, pagination }) {
  return (
    <>
      <DefaultLayout metadata={{ title: `Página ${pagination.currentPage} · Relevantes` }}>
        <ContentList contentList={contentListFound} pagination={pagination} paginationBasePath="/pagina" />
      </DefaultLayout>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [{ params: { page: '2' } }, { params: { page: '3' } }],
    fallback: 'blocking',
  };
}

export const getStaticProps = getStaticPropsRevalidate(async (context) => {
  const userTryingToGet = user.createAnonymous();

  context.params = context.params ? context.params : {};

  try {
    context.params = validator(context.params, {
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 10,
  };
});
