import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { Box, Content, DefaultLayout, Flash, Heading, Link } from '@/TabNewsUI';
import { useUser } from 'pages/interface';

export default function Post() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { data: contents } = useSWR(user ? `/api/v1/contents/${user.username}?strategy=new&per_page=1` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
    }
  }, [user, router, isLoading]);

  return (
    <DefaultLayout metadata={{ title: 'Publicar novo conteúdo' }}>
      <Box sx={{ width: '100%', mb: 3 }}>
        <Flash variant="warning">
          {' '}
          <Link href="tutorial-como-fazer-publicacoes">
            Clique aqui
          </Link>{' '}
          para aprender como fazer boas publicações
         </Flash>
      </Box>


      <Heading as="h1" sx={{ mb: 3 }}>
        Publicar
      </Heading>
      <Content mode="edit" />
    </DefaultLayout>
  );
}
