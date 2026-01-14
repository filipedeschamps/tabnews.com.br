import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, UserHeader } from '@/TabNewsUI';
import { BookmarkFilledIcon } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import authorization from 'models/authorization.js';
import favorites from 'models/favorites.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function SavedContent({ contentListFound, pagination, username }) {
  const { user, isLoading } = useUser();
  const isAuthenticatedUser = user && user.username === username;

  return (
    <DefaultLayout metadata={{ title: `Favoritos · Página ${pagination.currentPage} · ${username}` }}>
      <UserHeader username={username} />

      <ContentList
        contentList={contentListFound}
        pagination={pagination}
        paginationBasePath={`/${username}/conteudos-salvos`}
        emptyStateProps={{
          isLoading: isLoading,
          title: 'Nenhum conteúdo salvo',
          description: `${isAuthenticatedUser ? 'Você' : username} ainda não salvou nenhum conteúdo.`,
          icon: BookmarkFilledIcon,
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
  const CONTENT_PER_PAGE = 15;

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

    results = await favorites.findAll({
      user_id: secureUserFound.id,
      page: context.params.page,
      per_page: CONTENT_PER_PAGE,
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

  const contentListFound = results.saved_contents;
  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);
  const currentPage = context.params.page || 1;
  const lastPage = Math.ceil(results.total / CONTENT_PER_PAGE);

  const pagination = {
    currentPage,
    lastPage,
    totalRows: results.total,
    perPage: CONTENT_PER_PAGE,
    firstPage: 1,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < lastPage ? currentPage + 1 : null,
  };

  if (secureContentListFound.length === 0 && context.params.page !== 1) {
    const lastValidPage = `/${secureUserFound.username}/conteudos-salvos/${pagination.lastPage || 1}`;
    const revalidate = context.params.page > pagination.lastPage + 1 ? 60 : 1;

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
      pagination,
      username: secureUserFound.username,
    },
    revalidate: 10,
  };
});
