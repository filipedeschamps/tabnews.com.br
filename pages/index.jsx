import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout } from '@/TabNewsUI';
import { FaTree } from '@/TabNewsUI/icons';
import ad from 'models/advertisement';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function Home({ adFound, contentListFound, pagination }) {
  return (
    <DefaultLayout>
      <ContentList
        ad={adFound}
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
  );
}

export const getStaticProps = getStaticPropsRevalidate(async () => {
  const userTryingToGet = user.createAnonymous();

  const params = validator({}, { per_page: 'optional' });

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: 1,
    per_page: params.per_page,
  });

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  const adsFound = await ad.getRandom(1);
  const secureAdValues = authorization.filterOutput(userTryingToGet, 'read:ad:list', adsFound);

  return {
    props: {
      adFound: secureAdValues[0] ?? null,
      contentListFound: secureContentValues,
      pagination: results.pagination,
    },
    revalidate: 10,
  };
});
