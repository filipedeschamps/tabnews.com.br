import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';

export default function Home({ contentListFound, pagination }) {
  return (
    <>
      <DefaultLayout metadata={{ title: `Página ${pagination.currentPage} · Melhores` }}>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath="/pagina"
          revalidatePath={`/api/v1/contents?strategy=relevant&page=${pagination.currentPage}`}
        />
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

export async function getStaticProps(context) {
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
      revalidate: 1,
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
}
