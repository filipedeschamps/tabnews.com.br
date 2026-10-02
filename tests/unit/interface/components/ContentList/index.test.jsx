import { render } from '@testing-library/react';

import ContentList from 'interface/components/ContentList';

function makeContent(id) {
  return {
    id,
    owner_username: 'author',
    slug: `post-${id}`,
    title: `Post ${id}`,
    type: 'content',
    tabcoins: 1,
    tabcoins_credit: 1,
    tabcoins_debit: 0,
    children_deep_count: 0,
    published_at: new Date().toISOString(),
  };
}

const pagination = { perPage: 30, currentPage: 1, nextPage: 2 };

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response());
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ContentList', () => {
  it('does not warm the next page while the list matches what was first rendered', () => {
    const list = [makeContent('1'), makeContent('2')];

    const { rerender } = render(
      <ContentList contentList={list} pagination={pagination} paginationBasePath="/pagina" />,
    );

    // A re-render with an equivalent (same ids) list simulates next-swr's own revalidation
    // resolving with unchanged data — no reason to warm the next page.
    rerender(<ContentList contentList={[...list]} pagination={pagination} paginationBasePath="/pagina" />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('warms the next page once the revalidated list differs from what was first rendered', () => {
    const initialList = [makeContent('1'), makeContent('2')];
    const revalidatedList = [makeContent('3'), makeContent('1')];

    const { rerender } = render(
      <ContentList contentList={initialList} pagination={pagination} paginationBasePath="/pagina" />,
    );

    rerender(<ContentList contentList={revalidatedList} pagination={pagination} paginationBasePath="/pagina" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/pagina/2');

    // Further changes should not trigger a second warm-up of the same next page.
    rerender(<ContentList contentList={[makeContent('4')]} pagination={pagination} paginationBasePath="/pagina" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not warm anything when there is no next page', () => {
    const initialList = [makeContent('1')];
    const revalidatedList = [makeContent('2')];
    const lastPagePagination = { ...pagination, nextPage: null };

    const { rerender } = render(
      <ContentList contentList={initialList} pagination={lastPagePagination} paginationBasePath="/pagina" />,
    );

    rerender(
      <ContentList contentList={revalidatedList} pagination={lastPagePagination} paginationBasePath="/pagina" />,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
