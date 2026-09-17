import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import Content from 'interface/components/Content';
import { routerMock } from 'tests/unit/interface/nextRouterMock';

vi.mock('interface', async (importOriginal) => ({
  ...(await importOriginal()),
  useUser: () => ({ user: { id: 'reader-id' }, fetchUser: () => {} }),
}));

vi.mock('next/router', () => ({ useRouter: () => routerMock }));

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

// The `ui` project runs without isolation, so the globals touched here are restored afterwards.
beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(publishedReply), { status: 201 }))),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function renderReplyBox() {
  render(<Content content={repliedContent} rootContent={rootContent} mode="compact" />);
}

// `Tooltip` renders a hidden copy of its children to reserve their space, so the buttons are
// reached through the tooltip that labels them.
function button(tooltipText) {
  return within(screen.getByRole('tooltip', { name: tooltipText })).getByRole('button');
}

function publishReply() {
  fireEvent.click(button('Responder para author'));
  fireEvent.click(screen.getByText('Publicar'));

  return waitFor(() => expect(screen.getByText(publishedReply.body)).toBeInTheDocument());
}

describe('Content reply box', () => {
  it('should keep the share button of the replied content while replying and after publishing', async () => {
    renderReplyBox();

    expect(button('Compartilhar publicação')).toBeInTheDocument();

    fireEvent.click(button('Responder para author'));

    expect(button('Compartilhar publicação')).toBeInTheDocument();

    await publishReply();

    expect(button('Compartilhar publicação')).toBeInTheDocument();
  });

  it('should show the published reply carrying its own share button', async () => {
    renderReplyBox();

    await publishReply();

    // Being inside the article is what makes the button follow the reply, including when it is deleted.
    expect(document.getElementById('reader-reply-slug')).toContainElement(button('Compartilhar comentário'));
  });

  it('should disable the reply button while replying and once a reply is published', async () => {
    renderReplyBox();

    expect(button('Responder para author')).not.toBeDisabled();

    fireEvent.click(button('Responder para author'));

    expect(button('Responder para author')).toBeDisabled();

    await publishReply();

    expect(button('Responder para author')).toBeDisabled();
  });
});
