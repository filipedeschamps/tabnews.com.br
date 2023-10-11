import { getStaticPropsRevalidate } from 'next-swr';
import useSWR from 'swr';

import { BarChart } from '@/Charts';
import Graph from '@/Graph';
import { Box, DefaultLayout, Heading, Label, LabelGroup, Truncate } from '@/TabNewsUI';
import analytics from 'models/analytics.js';

export default function Page({ usersCreated, rootContentPublished, childContentPublished, votesGraph, votesTaken }) {
  const { data: statusObject, isLoading: statusObjectIsLoading } = useSWR('/api/v1/status', {
    refreshInterval: 1000 * 10,
  });

  return (
    <DefaultLayout metadata={{ title: 'Estatísticas e Status do Site' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Heading as="h1">Estatísticas e Status do Site</Heading>

        <BarChart title="Novos cadastros" data={usersCreated} yDataKey="cadastros" />

        <BarChart title="Novas publicações" data={rootContentPublished} yDataKey="conteudos" name="conteúdos" />

        <BarChart title="Novas respostas" data={childContentPublished} yDataKey="respostas" />

        <BarChart title="Novas qualificações" data={votesTaken} yDataKey="votos" />

        <Graph title="Qualificações × Usuários × Origens" data={votesGraph} />

        <Box>
          <h2>Banco de Dados</h2>

          {!statusObjectIsLoading && (
            <Box sx={{ display: 'grid' }}>
              <Box>
                Status:{' '}
                <Label variant={statusObject?.dependencies.database.status ? 'success' : 'danger'}>
                  {statusObject?.dependencies.database.status}
                </Label>
              </Box>
              <Box>
                Conexões disponíveis:{' '}
                <Label variant={statusObject?.dependencies.database.max_connections > 70 ? 'success' : 'danger'}>
                  {statusObject?.dependencies.database.max_connections}
                </Label>
              </Box>
              <Box>
                Conexões abertas:{' '}
                <Label
                  variant={
                    statusObject?.dependencies.database.opened_connections <
                    statusObject?.dependencies.database.max_connections * 0.7
                      ? 'success'
                      : 'danger'
                  }>
                  {statusObject?.dependencies.database.opened_connections}
                </Label>
              </Box>
              <Box>
                Latência:{' '}
                <LabelGroup>
                  <Label variant={statusObject?.dependencies.database.latency.first_query < 200 ? 'success' : 'danger'}>
                    {`${Math.round(statusObject?.dependencies.database.latency.first_query)}ms`}
                  </Label>
                  <Label
                    variant={statusObject?.dependencies.database.latency.second_query < 200 ? 'success' : 'danger'}>
                    {`${Math.round(statusObject?.dependencies.database.latency.second_query)}ms`}
                  </Label>
                  <Label variant={statusObject?.dependencies.database.latency.third_query < 200 ? 'success' : 'danger'}>
                    {`${Math.round(statusObject?.dependencies.database.latency.third_query)}ms`}
                  </Label>
                </LabelGroup>
              </Box>
              <Box>
                Versão do PostgreSQL:{' '}
                <Label variant={statusObject?.dependencies.database.version ? 'success' : 'danger'}>
                  {statusObject?.dependencies.database.version}
                </Label>
              </Box>
            </Box>
          )}
        </Box>

        <Box>
          <h2>Servidor Web</h2>

          {!statusObjectIsLoading && (
            <Box sx={{ display: 'grid' }}>
              <Box>
                Status:{' '}
                <Label variant={statusObject?.dependencies.webserver.status ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.status}
                </Label>
              </Box>
              <Box>
                Provedor:{' '}
                <Label variant={statusObject?.dependencies.webserver.provider ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.provider}
                </Label>
              </Box>
              <Box>
                Ambiente:{' '}
                <Label variant={statusObject?.dependencies.webserver.environment ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.environment}
                </Label>
              </Box>
              <Box>
                Região na AWS:{' '}
                <Label variant={statusObject?.dependencies.webserver.aws_region ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.aws_region}
                </Label>
              </Box>
              <Box>
                Região na Vercel:{' '}
                <Label variant={statusObject?.dependencies.webserver.vercel_region ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.vercel_region}
                </Label>
              </Box>
              <Box>
                Timezone:{' '}
                <Label variant={statusObject?.dependencies.webserver.timezone ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.timezone}
                </Label>
              </Box>
              <Box>
                Autor do último commit:{' '}
                <Label variant={statusObject?.dependencies.webserver.last_commit_author ? 'success' : 'danger'}>
                  <Truncate inline expandable sx={{ maxWidth: '170px' }}>
                    {statusObject?.dependencies.webserver.last_commit_author}
                  </Truncate>
                </Label>
              </Box>
              <Box>
                SHA do commit:{' '}
                <Label variant={statusObject?.dependencies.webserver.last_commit_message_sha ? 'success' : 'danger'}>
                  <Truncate inline expandable sx={{ maxWidth: '170px' }}>
                    {statusObject?.dependencies.webserver.last_commit_message_sha}
                  </Truncate>
                </Label>
              </Box>
              <Box>
                Versão do Node.js:{' '}
                <Label variant={statusObject?.dependencies.webserver.version ? 'success' : 'danger'}>
                  {statusObject?.dependencies.webserver.version}
                </Label>
              </Box>
            </Box>
          )}
        </Box>

        <Box>
          <h2>Contribuidores</h2>

          <a href="https://github.com/filipedeschamps/tabnews.com.br/graphs/contributors">
            <picture>
              <img
                src="https://contributors-img.web.app/image?repo=filipedeschamps/tabnews.com.br&max=500"
                alt="Lista de contribuidores"
                width="100%"
              />
            </picture>
          </a>
        </Box>
      </Box>
    </DefaultLayout>
  );
}

export const getStaticProps = getStaticPropsRevalidate(async () => {
  const childContentPublished = await analytics.getChildContentsPublished();
  const rootContentPublished = await analytics.getRootContentsPublished();
  const usersCreated = await analytics.getUsersCreated();
  const votesGraph = await analytics.getVotesGraph();
  const votesTaken = await analytics.getVotesTaken();

  return {
    props: {
      usersCreated,
      rootContentPublished,
      childContentPublished,
      votesGraph,
      votesTaken,
    },
    revalidate: 30,
    swr: { refreshInterval: 1000 * 60 * 5 },
  };
});
