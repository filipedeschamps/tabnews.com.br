import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import queryRankedContent_beta from 'models/queries_beta';

export default function Home({ contentListFound, pagination, beta }) {
  return (
    <>
      <DefaultLayout metadata={{ title: `Página ${pagination.currentPage} · Melhores` }}>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath={`/relevantes_beta/${beta}/pagina`}
          revalidatePath={`/api/v1/contents?strategy=relevant&page=${pagination.currentPage}`}
        />
      </DefaultLayout>
    </>
  );
}

export async function getStaticPaths() {
  const paths = [];

  Object.keys(queryRankedContent_beta).forEach((beta) => {
    paths.push({
      params: {
        beta: beta,
        page: '2',
      },
    });
    paths.push({
      params: {
        beta: beta,
        page: '3',
      },
    });
  });
  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();
  const beta = context.params.beta;

  if (!queryRankedContent_beta[beta]) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

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
    beta,
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
      beta,
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 1,
  };
}
