import { useRouter } from 'next/router';
import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout, UserHeader } from '@/TabNewsUI';
import { FaUser } from '@/TabNewsUI/icons';
import { NotFoundError } from 'errors';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';
import { useUser } from 'pages/interface';

export default function RootContent({ contentListFound, pagination, username }) {
  const { push } = useRouter();
  const { user, isLoading } = useUser();
  const isAuthenticatedUser = user && user.username === username;

  return (
    <DefaultLayout metadata={{ title: `Publicações · Página ${pagination.currentPage} · ${username}` }}>
      <UserHeader username={username} rootContentCount={pagination.totalRows} />

      <ContentList
        contentList={contentListFound}
        pagination={pagination}
        paginationBasePath={`/${username}/conteudos`}
        emptyStateProps={{
          isLoading: isLoading,
          title: 'Nenhuma publicação encontrada',
          description: `${isAuthenticatedUser ? 'Você' : username} ainda não fez nenhuma publicação.`,
          icon: FaUser,
          action: isAuthenticatedUser && {
            text: 'Publicar conteúdo',
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
        parent_id: null,
        owner_id: secureUserFound.id,
        status: 'published',
        type: 'content',
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
    const lastValidPage = `/${secureUserFound.username}/conteudos/${results.pagination.lastPage || 1}`;
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
