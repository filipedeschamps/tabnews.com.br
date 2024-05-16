import { Box, ContentList, DefaultLayout, Heading, SearchTabNav } from '@/TabNewsUI';
import authorization from 'models/authorization';
import search from 'models/search';
import user from 'models/user';
import validator from 'models/validator';

export default function SearchHome({ query, searchRuntime, contentListFound, pagination }) {
  return (
    <>
      <DefaultLayout
        metadata={{
          title: `Página ${pagination.currentPage || 1} · Buscar ${query}`,
          description: `Busca por "${query}" no TabNews ordenadas por relevancia.`,
        }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
          <Heading as="h2" sx={{ fontSize: 20 }}>
            Resultados da busca por {`"${query}"`}
          </Heading>
          <Box
            as="p"
            sx={{
              fontSize: 14,
            }}>
            {`Cerca de ${pagination.totalRows > 2 ? `${pagination.totalRows} resultados` : `${pagination.totalRows || 0} resultado`} (${searchRuntime})`}{' '}
            - Página {`${pagination.currentPage || 1} de ${pagination.lastPage || 1}`}
          </Box>
        </Box>
        <SearchTabNav searchTerm={query} />
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBaseQuery={`?q=${query}`}
          paginationBasePath={`/buscar/pagina`}
        />
      </DefaultLayout>
    </>
  );
}

export async function getServerSideProps(context) {
  const userTryingToGet = user.createAnonymous();

  context.params = context.params ? context.params : {};

  try {
    context.params = validator(context.params, {
      page: 'optional',
    });

    context.query = validator(context.query, {
      q: 'required',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  try {
    const results = await search.findAll({
      searchTerm: context.query.q,
      sortBy: 'relevance',
      page: context.params.page,
    });

    if (results) {
      const searchResults = JSON.parse(JSON.stringify(results));

      const contentListFound = searchResults.results || [];

      const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

      return {
        props: {
          searchRuntime: searchResults.searchRuntime,
          query: context.query.q,
          contentListFound: secureContentValues,
          pagination: searchResults.pagination,
        },
      };
    } else {
      return {
        props: {
          searchRuntime: 0,
          query: context.query.q,
          contentListFound: [],
          pagination: [],
        },
      };
    }
  } catch (error) {
    return {
      props: {
        searchRuntime: 0,
        query: context.query.q,
        contentListFound: [],
        pagination: [],
      },
    };
  }
}
