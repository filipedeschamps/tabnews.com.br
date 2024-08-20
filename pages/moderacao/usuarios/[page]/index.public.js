import { useRouter } from 'next/router';
import parseLinkHeader from 'parse-link-header';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { DefaultLayout, UserList } from '@/TabNewsUI';
import { useUser } from 'pages/interface';

const basePath = '/moderacao/usuarios';

export default function UsersPage() {
  const { user, isLoading: userIsLoading } = useUser();
  const router = useRouter();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    previousPage: null,
    nextPage: null,
    perPage: 30,
    basePath,
  });

  const { page } = router.query;
  const isLoading = userIsLoading || !page;
  const shouldFetch = !isLoading && user?.features?.includes('read:user:list');

  const {
    data: { body: userListFound, headers },
  } = useSWR(shouldFetch ? `/api/v1/users?page=${page}` : null, {
    fallbackData: { body: [], headers: {} },
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (isLoading || shouldFetch) return;

    router.replace('/');
  }, [isLoading, router, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch) return;

    const linkHeader = parseLinkHeader(headers.get?.('Link'));

    const newPagination = {
      currentPage: page || 1,
      lastPage: linkHeader?.last?.page,
      previousPage: linkHeader?.prev?.page,
      nextPage: linkHeader?.next?.page,
      perPage: linkHeader?.last?.per_page || 30,
      basePath,
    };

    if (linkHeader && userListFound.length === 0 && newPagination.currentPage > 1) {
      router.replace(`${basePath}/${newPagination.lastPage}`);
      return;
    }

    if (linkHeader && newPagination.currentPage !== pagination.currentPage) {
      setPagination(newPagination);
    }
  }, [headers, page, pagination.currentPage, router, shouldFetch, userListFound.length]);

  return (
    <DefaultLayout
      metadata={{
        title: `Página ${pagination.currentPage} · Usuários`,
        description: 'Lista de usuários do TabNews.',
      }}>
      <UserList userList={userListFound} pagination={pagination} />
    </DefaultLayout>
  );
}
