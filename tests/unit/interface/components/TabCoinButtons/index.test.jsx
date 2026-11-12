import { renderToString } from 'react-dom/server';

import TabCoinButtons from 'interface/components/TabCoinButtons';

vi.mock('interface', async (importOriginal) => ({
  ...(await importOriginal()),
  useUser: () => ({ user: null, isLoading: true, fetchUser: () => {} }),
}));

vi.mock('next/router', () => ({ useRouter: () => ({ push: () => {}, asPath: '/author/post-slug' }) }));

const content = { id: 'post-id', status: 'published', tabcoins: 3, tabcoins_credit: 4, tabcoins_debit: -1 };

describe('TabCoinButtons', () => {
  // Without JavaScript, text-mode browsers (Lynx, w3m, ELinks) ignore `aria-label` and only show text.
  it('should render the vote button labels as text in the server HTML', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<TabCoinButtons content={content} />);

    expect(container).toHaveTextContent('Achei relevante');
    expect(container).toHaveTextContent('Não achei relevante');
  });
});
