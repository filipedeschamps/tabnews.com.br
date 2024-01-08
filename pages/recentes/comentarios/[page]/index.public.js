import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, RecentTabNav } from '@/TabNewsUI';
import webserver from 'infra/webserver';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function CommentsPage({ contentListFound, pagination }) {
  return (
    <DefaultLayout
      metadata={{
        title: `Página ${pagination.currentPage} · Comentários Recentes`,
        description: 'Comentários no TabNews ordenadas pelos mais recentes.',
      }}>
      <RecentTabNav />
      <ContentList contentList={contentListFound} pagination={pagination} paginationBasePath="/recentes/comentarios" />
    </DefaultLayout>
  );
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
    strategy: 'new',
    where: {
      status: 'published',
      $not_null: ['parent_id'],
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  if (contentListFound.length === 0 && context.params.page !== 1 && !webserver.isBuildTime) {
    const lastValidPage = `/recentes/comentarios/${results.pagination.lastPage || 1}`;
    const revalidate = context.params.page > results.pagination.lastPage + 1 ? 10 : 1;

    return {
      redirect: {
        destination: lastValidPage,
      },
      revalidate,
    };
  }

  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  for (const content of secureContentListFound) {
    content.body = removeMarkdown(content.body, { maxLength: 255 });
  }

  return {
    props: {
      contentListFound: secureContentListFound,
      pagination: results.pagination,
    },
    revalidate: 1,
  };
});

export async function getStaticPaths() {
  return {
    paths: [{ params: { page: '1' } }, { params: { page: '2' } }, { params: { page: '3' } }],
    fallback: 'blocking',
  };
}
