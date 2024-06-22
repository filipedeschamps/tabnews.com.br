import { DefaultLayout, UserList } from '@/TabNewsUI';
import authorization from 'models/authorization';
import removeMarkdown from 'models/remove-markdown';
import session from 'models/session';
import user from 'models/user';
import validator from 'models/validator';

export default function UsersPage({ userListFound, pagination }) {
  return (
    <DefaultLayout
      metadata={{
        title: `Página ${pagination.currentPage} · Usuários`,
        description: 'Lista de usuários do TabNews.',
      }}>
      <UserList userList={userListFound} pagination={pagination} paginationBasePath="/usuarios/pagina" />
    </DefaultLayout>
  );
}

export const getServerSideProps = async (context) => {
  try {
    context.params = validator(context.params, {
      page: 'optional',
      per_page: 'optional',
    });
  } catch {
    return {
      notFound: true,
    };
  }

  let userTryingToGet;
  try {
    const sessionObject = await session.findOneValidFromRequest(context.req);
    userTryingToGet = await user.findOneById(sessionObject.user_id);
  } catch {
    return {
      notFound: true,
    };
  }

  if (!userTryingToGet.features.includes('read:user:list')) {
    return {
      notFound: true,
    };
  }

  const results = await user.findAllWithPagination({
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const userListFound = results.rows;

  const secureUserListFound = authorization.filterOutput(userTryingToGet, 'read:user:list', userListFound);

  if (secureUserListFound.length === 0 && context.params.page !== 1) {
    const lastValidPage = `/usuarios/pagina/${results.pagination.lastPage || 1}`;

    return {
      redirect: {
        destination: lastValidPage,
      },
    };
  }

  for (const user of secureUserListFound) {
    user.description = removeMarkdown(user.description, { maxLength: 255 });
  }

  return {
    props: {
      userListFound: secureUserListFound,
      pagination: results.pagination,
    },
  };
};
