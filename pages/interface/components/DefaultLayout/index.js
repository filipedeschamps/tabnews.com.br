import { useRouter } from 'next/router';
import { Box } from '@primer/react';

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
    author: content ? content.username : null,
    type: content ? 'article' : 'website',
    noIndex: false,
  };

  let updatedMetadata = { ...defaultMetadata, ...metadata };

  if (content) {
    if (content.title) {
      updatedMetadata.title = `${content.title} · ${content.username}`;
    } else {
      updatedMetadata.title = `${content.body.replace(/\s+/g, ' ').substring(0, 80)} · ${content.username}`;
    }

    updatedMetadata.description = content.body.replace(/\s+/g, ' ').substring(0, 190);
  }

  if (updatedMetadata.title && updatedMetadata.title != defaultMetadata.title) {
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
