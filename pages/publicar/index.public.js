import useSWR from 'swr';
import { DefaultLayout, Content, useUser } from 'pages/interface/index.js';
import { Box, Heading, Flash, Link } from '@primer/react';

export default function Post() {
  const { user } = useUser();
  const { data: contents } = useSWR(user?.username ? `/api/v1/contents/${user.username}` : null);

  return (
    <DefaultLayout metadata={{ title: 'Publicar novo conteúdo' }}>
      {contents?.length === 0 && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Flash variant="warning">
            ⚠ Atenção: esta parece ser sua primeira publicação. Pedimos encarecidamente que{' '}
            <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
              leia isso antes
            </Link>
            .
          </Flash>
        </Box>
      )}

      <Heading as="h1" sx={{ mb: 3 }}>
        Publicar novo conteúdo
      </Heading>
      <Content mode="edit" />
    </DefaultLayout>
  );
}
