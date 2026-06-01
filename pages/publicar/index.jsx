import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { Content, DefaultLayout, Flash, Heading, Link } from '@/TabNewsUI';
import { useUser } from 'interface';

import classes from './index.module.css';

export default function Post() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const {
    data: { body: contents },
  } = useSWR(user ? `/api/v1/contents/${user.username}?strategy=new&per_page=1` : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
    }
  }, [user, router, isLoading]);

  return (
    <DefaultLayout
      metadata={{
        title: 'Publicar novo conteúdo',
        description:
          'Publicar novo conteúdo no TabNews - artigos, tutoriais, indicações, curiosidades, ferramentas e outros assuntos relacionados a tecnologia.',
      }}>
      {contents?.length === 0 && (
        <div className={classes.FlashWrapper}>
          <Flash variant="warning">
            ⚠ Atenção: Pedimos encarecidamente que{' '}
            <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
              leia isso antes
            </Link>{' '}
            de fazer sua primeira publicação.
          </Flash>
        </div>
      )}

      <Heading as="h1" className={classes.Heading}>
        Publicar novo conteúdo
      </Heading>
      <Content mode="edit" />
    </DefaultLayout>
  );
}
