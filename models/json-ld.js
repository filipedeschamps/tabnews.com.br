import webserver from 'infra/webserver';
import removeMarkdown from 'models/remove-markdown';

function getBreadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function getOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: webserver.host,
    logo: `${webserver.host}/brand/rounded-light-filled.svg`,
    name: 'TabNews',
    description:
      'O TabNews é um site focado na comunidade da área de tecnologia, destinado a debates e troca de conhecimentos por meio de publicações e comentários criados pelos próprios usuários.',
    email: 'contato@tabnews.com.br',
    foundingDate: '2022-05-06T15:20:01.158Z',
  };
}

function getPosting(content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: content.title,
    sharedContent: content.source_url ? { '@type': 'WebPage', url: content.source_url } : undefined,
    ...getCommonPostingAndComment(content),
  };
}

function getCommonPostingAndComment(content) {
  return {
    identifier: content.id,
    author: {
      '@type': 'Person',
      name: content.owner_username,
      identifier: content.owner_id,
      url: `${webserver.host}/${content.owner_username}`,
    },
    url: `${webserver.host}/${content.owner_username}/${content.slug}`,
    datePublished: content.published_at,
    dateModified: content.updated_at,
    text: removeMarkdown(content.body),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: content.tabcoins_credit,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DislikeAction',
        userInteractionCount: Math.abs(content.tabcoins_debit),
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: content.children_deep_count,
      },
    ],
    comment:
      content.children?.map((child) => ({
        '@type': 'Comment',
        ...getCommonPostingAndComment(child),
      })) ?? [],
  };
}

function getProfile(user) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: user.created_at,
    dateModified: user.updated_at,
    mainEntity: {
      '@type': 'Person',
      name: user.username,
      identifier: user.id,
      description: user.description ? removeMarkdown(user.description) : undefined,
    },
  };
}

export default Object.freeze({
  getBreadcrumb,
  getOrganization,
  getPosting,
  getProfile,
});
