import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { FaTree } from 'react-icons/fa';

export default function HomeOffline() {
  return (
    <div style={{ margin: '20px' }}>
      <h1>Turma, atenção!</h1>
      <p>
        O vídeo de lançamento derrubou a API. Nós estamos utilizando a{' '}
        <strong>menor instância do Banco de Dados</strong> da AWS e ela não deu conta.
      </p>
      <p>
        Dentro dos primeiros <strong>60 minutos</strong> foram mais de <strong>1 Milhão de Requests</strong>, olha isso:
      </p>

      <p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Requests" src="https://i.imgur.com/pbtnUyr.png" style={{ maxWidth: '800px' }} />
      </p>

      <p>Mas já já a gente volta, combinado? :) então muito obrigado por acessar!</p>
      <p>
        No mais, sugiro acessar o{' '}
        <a href="https://github.com/filipedeschamps/tabnews.com.br">repositório lá no GitHub</a>.
      </p>
      <p>
        Abração e até daqui a pouco ❤️
        <br />
        <strong>Filipe Deschamps</strong>
      </p>
    </div>
  );
}

function Home({ contentListFound, pagination }) {
  return (
    <>
      <DefaultLayout>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath="/pagina"
          revalidatePath="/api/v1/contents?strategy=relevant"
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

export async function getStaticProps(context) {
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
    revalidate: 1,
  };
}
