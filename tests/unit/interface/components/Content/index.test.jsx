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

function renderReplyBox(onPublish) {
  render(<Content content={repliedContent} rootContent={rootContent} mode="compact" onPublish={onPublish} />);
}

// `Tooltip` renders a hidden copy of its children to reserve their space, so the buttons are
// reached through the tooltip that labels them.
function tooltip(text) {
  return screen.getByRole('tooltip', { name: text });
}

function clickButton(tooltipText) {
  fireEvent.click(within(tooltip(tooltipText)).getByRole('button'));
}

function comesBefore(element, otherElement) {
  return !!(element.compareDocumentPosition(otherElement) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Content reply box', () => {
  it('should keep the share button in place while the reply editor is open', () => {
    renderReplyBox();

    expect(comesBefore(tooltip('Responder para author'), tooltip('Compartilhar publicação'))).toBe(true);

    clickButton('Responder para author');

    expect(comesBefore(tooltip('Compartilhar publicação'), screen.getByText('Seu comentário'))).toBe(true);
  });

  it('should hand a published reply to the page and go back to the compact mode', async () => {
    const onPublish = vi.fn();

    renderReplyBox(onPublish);

    clickButton('Responder para author');
    fireEvent.click(screen.getByText('Publicar'));

    await waitFor(() => expect(onPublish).toHaveBeenCalledWith(publishedReply));

    expect(tooltip('Responder para author')).toBeInTheDocument();
    expect(tooltip('Compartilhar publicação')).toBeInTheDocument();
    expect(screen.queryByText(publishedReply.body)).not.toBeInTheDocument();
  });
});
