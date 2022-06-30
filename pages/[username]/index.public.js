import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { NotFoundError } from 'errors/index.js';

export default function Home({ contentListFound, pagination, username }) {
  return (
    <>
      <DefaultLayout metadata={{ title: `${username}` }}>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath={`/${username}/pagina`}
          revalidatePath={`/api/v1/contents/${username}?strategy=new`}
        />
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

  try {
    context.params = validator(context.params, {
      username: 'required',
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  let results;

  try {
    results = await content.findWithStrategy({
      strategy: 'new',
      where: {
        username: context.params.username,
        parent_id: null,
        status: 'published',
      },
      page: context.params.page,
      per_page: context.params.per_page,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
      };
    }

    throw error;
  }

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
      username: context.params.username,
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 1,
  };
}
