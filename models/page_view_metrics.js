import { gql, request } from 'graphql-request';

import { ServiceError } from 'errors';
import logger from 'infra/logger';

const url = 'https://api.cloudflare.com/client/v4/graphql';
const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;

if (!token) console.error('CLOUDFLARE_ANALYTICS_TOKEN not found.');

const document = gql`
  query ($since: Time!, $path: String!) {
    viewer {
      zones {
        httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: $since, clientRequestPath: $path }) {
          sum {
            visits
          }
        }
      }
    }
  }
`;

export default async function getPageViewMetrics(path) {
  if (!token) return { week_viewers: 0 };

  let week_viewers = 0;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const data = await request(
      url,
      document,
      { since, path },
      {
        Authorization: `Bearer ${token}`,
      },
    );

    week_viewers = data.viewer.zones[0].httpRequestsAdaptiveGroups[0]?.sum.visits || 0;
  } catch (error) {
    logError(error, path);
  }

  return { week_viewers };
}

function logError(error, path) {
  logger.error(
    new ServiceError({
      message: error.message,
      action: 'Verifique se a API GraphQL da Cloudflare está disponível.',
      stack: error.stack,
      context: {
        path: path,
      },
      errorLocationCode: 'MODELS:PAGE_VIEW_METRICS:GET',
    }),
  );
}
