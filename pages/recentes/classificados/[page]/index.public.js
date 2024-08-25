import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, RecentTabNav } from '@/TabNewsUI';
import webserver from 'infra/webserver';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import jsonLd from 'models/json-ld';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function ContentsPage({ contentListFound, pagination }) {
  const breadcrumbItems = [
    { name: 'Recentes', url: `${webserver.host}/recentes/pagina/1` },
    { name: 'Classificados', url: `${webserver.host}/recentes/classificados/1` },
  ];

  if (pagination.currentPage > 1) {
    breadcrumbItems.push({
      name: `Página ${pagination.currentPage}`,
      url: `${webserver.host}/recentes/classificados/${pagination.currentPage}`,
    });
  }

  return (
    <DefaultLayout
      metadata={{
        title: `Página ${pagination.currentPage} · Classificados Recentes`,
        description: 'Classificados do TabNews ordenados pelos mais recentes.',
        jsonLd: jsonLd.getBreadcrumb(breadcrumbItems),
      }}>
      <RecentTabNav />
      <ContentList
        contentList={contentListFound}
        pagination={pagination}
        paginationBasePath="/recentes/classificados"
      />
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
      type: 'ad',
    },
    attributes: {
      exclude: ['body'],
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  if (contentListFound.length === 0 && context.params.page !== 1 && !webserver.isBuildTime) {
    const lastValidPage = `/recentes/classificados/${results.pagination.lastPage || 1}`;
    const revalidate = context.params.page > results.pagination.lastPage + 1 ? 10 : 1;

    return {
      redirect: {
        destination: lastValidPage,
      },
      revalidate,
    };
  }

  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: secureContentListFound,
      pagination: results.pagination,
    },
    revalidate: 10,
  };
});

export function getStaticPaths() {
  return {
    paths: [{ params: { page: '1' } }, { params: { page: '2' } }, { params: { page: '3' } }],
    fallback: 'blocking',
  };
}
