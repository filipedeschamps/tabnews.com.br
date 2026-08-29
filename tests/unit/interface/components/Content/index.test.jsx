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
const publishedReply = {
  id: 'reply-id',
  owner_id: 'reader-id',
  owner_username: 'reader',
  parent_id: 'post-id',
  slug: 'reply-slug',
  status: 'published',
  body: 'A minha resposta',
};

vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(publishedReply), { status: 201 }))),
);

// The page builds the placeholder of the replied content inline, so every render of the page gives
// the component a new one. The returned function reproduces that.
function renderReplyBox() {
  const { rerender } = render(<Content content={repliedContent} rootContent={rootContent} mode="compact" />);

  return () => rerender(<Content content={{ ...repliedContent }} rootContent={rootContent} mode="compact" />);
}

// `Tooltip` renders a hidden copy of its children to reserve their space, so the buttons are
// reached through the tooltip that labels them.
function clickButton(tooltipText) {
  fireEvent.click(within(screen.getByRole('tooltip', { name: tooltipText })).getByRole('button'));
}

function publishReply() {
  clickButton('Responder para author');
  fireEvent.click(screen.getByText('Publicar'));

  return waitFor(() => expect(screen.getByText(publishedReply.body)).toBeInTheDocument());
}

function comesBefore(element, otherElement) {
  return !!(element.compareDocumentPosition(otherElement) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Content reply box', () => {
  beforeEach(() => {
    writeText.mockClear();
  });

  it('should keep the share button in place while the reply editor is open', () => {
    renderReplyBox();

    const replyButton = screen.getByRole('tooltip', { name: 'Responder para author' });

    expect(comesBefore(replyButton, screen.getByRole('tooltip', { name: 'Compartilhar publicação' }))).toBe(true);

    clickButton('Responder para author');

    const shareButton = screen.getByRole('tooltip', { name: 'Compartilhar publicação' });

    expect(comesBefore(shareButton, screen.getByText('Seu comentário'))).toBe(true);
  });

  it('should keep sharing the replied content after the reply is published', async () => {
    const rerenderPage = renderReplyBox();

    await publishReply();

    const shareButton = screen.getByRole('tooltip', { name: 'Compartilhar publicação' });

    expect(comesBefore(shareButton, screen.getByText(publishedReply.body))).toBe(true);

    rerenderPage();
    clickButton('Compartilhar publicação');

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/author/post-slug'));
  });

  it('should share the reply that was just published', async () => {
    const rerenderPage = renderReplyBox();

    await publishReply();

    const shareButton = screen.getByRole('tooltip', { name: 'Compartilhar comentário' });

    expect(comesBefore(screen.getByText(publishedReply.body), shareButton)).toBe(true);

    rerenderPage();
    clickButton('Compartilhar comentário');

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/reader/reply-slug'));
  });
});
