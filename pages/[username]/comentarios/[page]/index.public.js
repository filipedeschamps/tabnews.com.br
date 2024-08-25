import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, UserHeader } from '@/TabNewsUI';
import { FaUser } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import webserver from 'infra/webserver';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import jsonLd from 'models/json-ld';
import removeMarkdown from 'models/remove-markdown.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function ChildContent({ contentListFound, pagination, userFound }) {
  const { user, isLoading } = useUser();
  const isAuthenticatedUser = user && user.username === userFound.username;

  const breadcrumbItems = [
    { name: userFound.username, url: `${webserver.host}/${userFound.username}` },
    { name: 'Comentários', url: `${webserver.host}/${userFound.username}/comentarios/1` },
  ];

  if (pagination.currentPage > 1) {
    breadcrumbItems.push({
      name: `Página ${pagination.currentPage}`,
      url: `${webserver.host}/${userFound.username}/comentarios/${pagination.currentPage}`,
    });
  }

  return (
    <DefaultLayout
      metadata={{
        title: `Comentários · Página ${pagination.currentPage} · ${userFound.username}`,
        jsonLd: [jsonLd.getBreadcrumb(breadcrumbItems), jsonLd.getProfile(userFound)],
      }}>
      <UserHeader username={userFound.username} childContentCount={pagination.totalRows} />

      <ContentList
        contentList={contentListFound}
        pagination={pagination}
        paginationBasePath={`/${userFound.username}/comentarios`}
        emptyStateProps={{
          isLoading: isLoading,
          title: 'Nenhum comentário encontrado',
          description: `${isAuthenticatedUser ? 'Você' : userFound.username} ainda não fez nenhum comentário.`,
          icon: FaUser,
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
        $not_null: ['parent_id'],
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
    const lastValidPage = `/${secureUserFound.username}/comentarios/${results.pagination.lastPage || 1}`;
    const revalidate = context.params.page > results.pagination.lastPage + 1 ? 60 : 1;

    return {
      redirect: {
        destination: lastValidPage,
      },
      revalidate,
    };
  }

  for (const content of secureContentListFound) {
    content.body = removeMarkdown(content.body, { maxLength: 255 });
  }

  return {
    props: {
      contentListFound: secureContentListFound,
      pagination: results.pagination,
      userFound: secureUserFound,
    },

    revalidate: 10,
  };
});
