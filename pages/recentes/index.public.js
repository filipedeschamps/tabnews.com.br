import { getStaticPropsRevalidate } from 'next-swr';

import { Box, ContentList, Heading, Viewer, DefaultLayout } from '@/TabNewsUI';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function Home({ contentListFound, pagination }) {
  const body = `  

 Aqui você vai encontrar, **notícias**, **artigos**, **tutoriais**, **indicações**, **curiosidades** e dúvidas respondidas ou que você pode responder ordenadas pelo conteúdo mais recente, veja também o nosso [FAQ](faq)

 <br>
 
  `;


  return (
    <>
      <DefaultLayout
        metadata={{
          title: 'Recentes',
          description: 'Publicações no TabNews ordenadas pelas mais recentes.',
        }}>
      <Box>
        <Viewer value={body} />
      </Box>

        <ContentList contentList={contentListFound} pagination={pagination} paginationBasePath="/recentes/pagina" />

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
    strategy: 'new',
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
