import { useRouter } from 'next/router';
import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, UserHeader } from '@/TabNewsUI';
import { FaUser } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import webserver from 'infra/webserver';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import jsonLd from 'models/json-ld';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function RootContent({ contentListFound, pagination, username }) {
  const { push } = useRouter();
  const { user, isLoading } = useUser();
  const isAuthenticatedUser = user && user.username === username;
  const breadcrumbItems = [
    { name: username, url: `${webserver.host}/${username}` },
    { name: 'Classificados', url: `${webserver.host}/${username}/classificados/1` },
  ];

  if (pagination.currentPage > 1) {
    breadcrumbItems.push({
      name: `Página ${pagination.currentPage}`,
      url: `${webserver.host}/${username}/classificados/${pagination.currentPage}`,
    });
  }

  return (
    <DefaultLayout
      metadata={{
        title: `Classificados · Página ${pagination.currentPage} · ${username}`,
        jsonLd: jsonLd.getBreadcrumb(breadcrumbItems),
      }}>
      <UserHeader username={username} adContentCount={pagination.totalRows} />

      <ContentList
        contentList={contentListFound}
        pagination={pagination}
        paginationBasePath={`/${username}/classificados`}
        emptyStateProps={{
          isLoading: isLoading,
          title: 'Nenhum classificado encontrado',
          description: `${isAuthenticatedUser ? 'Você' : username} não possui anúncios publicados.`,
          icon: FaUser,
          action: isAuthenticatedUser && {
            text: 'Publicar',
            onClick: () => push('/publicar'),
          },
        }}
      />
    </DefaultLayout>
  );
}

export function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export const getStaticProps = getStaticPropsRevalidate(async (context) => {
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
  let secureUserFound;

  try {
    const userFound = await user.findOneByUsername(context.params.username);

    secureUserFound = authorization.filterOutput(userTryingToGet, 'read:user', userFound);

    results = await content.findWithStrategy({
      strategy: 'new',
      where: {
        owner_id: secureUserFound.id,
        status: 'published',
        type: 'ad',
      },
      attributes: {
        exclude: ['body'],
      },
      page: context.params.page,
      per_page: context.params.per_page,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
        revalidate: 1,
      };
    }

    throw error;
  }

  const contentListFound = results.rows;

  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  if (secureContentListFound.length === 0 && context.params.page !== 1) {
    const lastValidPage = `/${secureUserFound.username}/classificados/${results.pagination.lastPage || 1}`;
    const revalidate = context.params.page > results.pagination.lastPage + 1 ? 60 : 1;

    return {
      redirect: {
        destination: lastValidPage,
      },
      revalidate,
    };
  }

  return {
    props: {
      contentListFound: secureContentListFound,
      pagination: results.pagination,
      username: secureUserFound.username,
    },

    revalidate: 10,
  };
});
