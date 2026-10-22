import content from 'models/content';
import { getStaticProps } from 'pages/[username]/[slug]';

vi.mock('models/content', () => ({
  default: {
    findTree: vi.fn(),
    findOne: vi.fn(),
  },
}));

function buildContent(overrides = {}) {
  return {
    id: '4f3d6738-e79f-4161-99e5-5e6c5a3f5a1e',
    owner_id: '7d139a6e-586e-4391-81a0-2648f22f5d15',
    parent_id: null,
    slug: 'titulo-da-publicacao',
    title: 'Título da publicação',
    body: 'Corpo da publicação com conteúdo relevante.',
    status: 'published',
    type: 'content',
    source_url: null,
    created_at: new Date('2026-10-22T12:00:00.000Z'),
    updated_at: new Date('2026-10-22T12:00:00.000Z'),
    published_at: new Date('2026-10-22T12:00:00.000Z'),
    deleted_at: null,
    owner_username: 'tabnewsUser',
    tabcoins: 1,
    tabcoins_credit: 0,
    tabcoins_debit: 0,
    children_deep_count: 0,
    children: [],
    path: [],
    ...overrides,
  };
}

describe('pages > [username] > [slug] > getStaticProps', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not set "noIndex" when content has positive tabcoins', async () => {
    const rootContent = buildContent({ tabcoins: 1 });
    content.findTree.mockResolvedValue([rootContent]);

    const response = await getStaticProps({
      params: { username: rootContent.owner_username, slug: rootContent.slug },
    });

    expect(response.props.contentMetadata.noIndex).toBe(false);
  });

  it('should not set "noIndex" when content has 0 tabcoins', async () => {
    const rootContent = buildContent({ tabcoins: 0 });
    content.findTree.mockResolvedValue([rootContent]);

    const response = await getStaticProps({
      params: { username: rootContent.owner_username, slug: rootContent.slug },
    });

    expect(response.props.contentMetadata.noIndex).toBe(false);
  });

  it('should set "noIndex" to true when content has negative tabcoins', async () => {
    const rootContent = buildContent({ tabcoins: -1, tabcoins_debit: -2 });
    content.findTree.mockResolvedValue([rootContent]);

    const response = await getStaticProps({
      params: { username: rootContent.owner_username, slug: rootContent.slug },
    });

    expect(response.props.contentMetadata.noIndex).toBe(true);
  });

  it('should set "noIndex" to true when content is of type "ad"', async () => {
    const adContent = buildContent({ type: 'ad', tabcoins: 1 });
    content.findTree.mockResolvedValue([adContent]);

    const response = await getStaticProps({
      params: { username: adContent.owner_username, slug: adContent.slug },
    });

    expect(response.props.contentMetadata.noIndex).toBe(true);
  });
});
