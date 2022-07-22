import nextConnect from 'next-connect';
import { formatISO } from 'date-fns';
import controller from 'models/controller.js';
import health from 'models/health.js';
import thumbnail from 'models/thumbnail.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getHandler);

async function getHandler(request, response) {
  let statusCode = 200;

  const checkedDependencies = await health.getDependencies();

  if (checkedDependencies.database.status === 'unhealthy') {
    statusCode = 503;
  }

  const contentFound = {
    id: '509b82c6-9e62-4e76-aaa6-5aaac52bb88e',
    owner_id: '07ea33ea-78bd-4578-bad2-1cf5323cab07',
    parent_id: null,
    slug: 'este-alimento-nao-existe',
    title: 'Este alimento não existe',
    body: 'Inspirado no [Essa Pessoa Não Existe](https://thispersondoesnotexist.com/), um projeto criado pela empresa NYX faz o mesmo, mas para alimentos: [This Food Does Not Exist](https://nyx-ai.github.io/stylegan2-flax-tpu/)\n\n## Todas as fotos abaixo não existem\n\nElas foram sintetizadas digitalmente por quatro modelos StyleGAN2.\n\n![4 fotos de cookies gerados por inteligência artificial](https://i.imgur.com/uZbt8j1.png)\n\n![4 fotos de bolos gerados por inteligência artificial](https://i.imgur.com/3SjGgez.png)\n\n![4 fotos de drinks (bebidas) gerados por inteligência artificial](https://i.imgur.com/Kjc46ec.png)\n\n![4 fotos de sushis gerados por inteligência artificial](https://i.imgur.com/3ShUrf4.png)\n\n## A pergunta que fica\n\nSerá que este é o início do fim para sites de Stock Photos como o Shutterstock?',
    status: 'published',
    source_url: 'https://github.com/nyx-ai/stylegan2-flax-tpu',
    created_at: '2022-07-21T15:47:50.733Z',
    updated_at: '2022-07-21T15:47:50.733Z',
    published_at: '2022-07-21T15:47:50.764Z',
    deleted_at: null,
    username: 'filipedeschamps',
    parent_title: null,
    parent_slug: null,
    parent_username: null,
    tabcoins: 9,
    children_deep_count: 3,
  };

  const thumbnailPng = await thumbnail.asPng(contentFound);

  response.statusCode = 200;
  response.setHeader('Content-Type', `image/png`);
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  response.end(thumbnailPng);
}
