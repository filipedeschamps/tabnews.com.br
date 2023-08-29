import { getStaticPropsRevalidate } from 'next-swr';

import { Box, ContentList, Heading, Viewer, DefaultLayout } from '@/TabNewsUI';
import { FaTree } from '@/TabNewsUI/icons';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function Home({ contentListFound, pagination }) {
  const body = `  

  Aqui você vai encontrar, **notícias**, **artigos**, **tutoriais**, **indicações**, **curiosidades** e dúvidas respondidas ou que você pode responder ordenadas por relevância, veja também o nosso [FAQ](faq)

 <br>
 
  `;
  return (
    <>
      <DefaultLayout>
      <Box>
        <Viewer value={body} />
      </Box>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath="/pagina"
          emptyStateProps={{
            title: 'Nenhum conteúdo encontrado',
            description: 'Quando eu cheguei era tudo mato...',
            icon: FaTree,
          }}
        />
      </DefaultLayout>
    </>
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
      revalidate: 1,
    };
  }

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
    },
    revalidate: 10,
  };
});
