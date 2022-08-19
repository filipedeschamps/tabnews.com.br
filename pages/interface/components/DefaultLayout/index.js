import { useRouter } from 'next/router';
import { Box } from '@primer/react';

import removeMarkdown from 'models/remove-markdown';
import webserver from 'infra/webserver.js';
import { BaseLayout, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata, content }) {
  const router = useRouter();
  const webserverHost = webserver.getHost();
  const defaultMetadata = {
    title: 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia',
    image: `${webserverHost}/default-image-share.png`,
    url: `${webserverHost}${router.asPath}`,
    description: null,
    published_time: content ? content.published_at : null,
    modified_time: content ? content.updated_at : null,
    author: content ? content.owner_username : null,
    type: content ? 'article' : 'website',
    noIndex: false,
  };

  let updatedMetadata = { ...defaultMetadata, ...metadata };

  if (content) {
    const cleanBody = removeMarkdown(content.body).replace(/\s+/g, ' ');

    updatedMetadata.title = `${content.title ?? cleanBody.substring(0, 80)} · ${content.owner_username}`;
    updatedMetadata.description = cleanBody.substring(0, 190);
    updatedMetadata.image = `${webserverHost}/api/v1/contents/${content.owner_username}/${content.slug}/thumbnail`;
  }

  if (updatedMetadata.title != defaultMetadata.title) {
    updatedMetadata.title = `${updatedMetadata.title} · TabNews`;
  }

  return (
    <BaseLayout metadata={updatedMetadata}>
      <Header />
      <Box
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          padding: [3, null, null, 4],
        }}>
        {children}
      </Box>
    </BaseLayout>
  );
}
