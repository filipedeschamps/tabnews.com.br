import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import Content from 'interface/components/Content';

vi.mock('interface', async (importOriginal) => ({
  ...(await importOriginal()),
  useUser: () => ({ user: { id: 'reader-id' }, fetchUser: () => {} }),
}));

vi.mock('next/router', () => ({ useRouter: () => ({ push: () => {}, asPath: '/author/post-slug' }) }));

// Publishing a short body asks for a confirmation, which is mounted outside the React tree.
vi.mock('@/TabNewsUI', async (importOriginal) => ({
  ...(await importOriginal()),
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

const writeText = vi.fn();
Object.defineProperty(navigator, 'clipboard', { value: { writeText } });

const rootContent = { id: 'post-id', title: 'Post title' };
const repliedContent = { owner_id: 'author-id', owner_username: 'author', parent_id: 'post-id', slug: 'post-slug' };

function renderReplyBox() {
  render(<Content content={repliedContent} rootContent={rootContent} mode="compact" />);
}

// `Tooltip` renders a hidden copy of its children to reserve their space, so the buttons are
// reached through the tooltip that labels them.
function clickButton(tooltipText) {
  fireEvent.click(within(screen.getByRole('tooltip', { name: tooltipText })).getByRole('button'));
}

function comesBefore(element, otherElement) {
  return !!(element.compareDocumentPosition(otherElement) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Content reply box', () => {
  it('should keep the share button in place while the reply editor is open', () => {
    renderReplyBox();

    const replyButton = screen.getByRole('tooltip', { name: 'Responder para author' });
    const shareButton = screen.getByRole('tooltip', { name: 'Compartilhar publicação' });

    expect(comesBefore(replyButton, shareButton)).toBe(true);

    clickButton('Responder para author');

    const editor = screen.getByText('Seu comentário');

    expect(screen.getByRole('tooltip', { name: 'Compartilhar publicação' })).toBeInTheDocument();
    expect(comesBefore(screen.getByRole('tooltip', { name: 'Compartilhar publicação' }), editor)).toBe(true);
  });

  it('should keep sharing the replied content after the reply is published', async () => {
    const publishedReply = {
      id: 'reply-id',
      owner_id: 'reader-id',
      owner_username: 'reader',
      parent_id: 'post-id',
      slug: 'reply-slug',
      status: 'published',
      body: 'A minha resposta',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(publishedReply), { status: 201 })));

    renderReplyBox();

    clickButton('Responder para author');
    fireEvent.click(screen.getByText('Publicar'));

    await waitFor(() => expect(screen.getByText('A minha resposta')).toBeInTheDocument());

    const shareButton = screen.getByRole('tooltip', { name: 'Compartilhar publicação' });

    expect(comesBefore(shareButton, screen.getByText('A minha resposta'))).toBe(true);

    clickButton('Compartilhar publicação');

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/author/post-slug'));
  });
});
