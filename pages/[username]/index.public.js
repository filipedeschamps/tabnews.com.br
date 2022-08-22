import { DefaultLayout, ContentList, useUser } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { NotFoundError } from 'errors/index.js';
import { FaUser } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function Home({ contentListFound, pagination, username }) {
  const { user, isLoading } = useUser();
  const { push } = useRouter();

  const isAuthenticatedUser = user && user.username === username;

  return (
    <>
      <DefaultLayout metadata={{ title: `${username}` }}>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath={`/${username}/pagina`}
          revalidatePath={`/api/v1/contents/${username}?strategy=new`}
          emptyStateProps={{
            isLoading: isLoading,
            title: 'Nenhum conteúdo encontrado',
            description: `${isAuthenticatedUser ? 'Você' : username} ainda não fez nenhuma publicação.`,
            icon: FaUser,
            action: isAuthenticatedUser && {
              text: 'Publicar conteúdo',
              onClick: () => push('/publicar'),
            },
          }}
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
      revalidate: 1,
    };
  }

  let results;

  try {
    results = await content.findWithStrategy({
      strategy: 'new',
      where: {
        owner_username: context.params.username,
        parent_id: null,
        status: 'published',
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

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
      username: context.params.username,
    },

    revalidate: 1,
  };
}
