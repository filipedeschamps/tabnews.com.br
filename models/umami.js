import snakeize from 'snakeize';

import { ServiceError } from 'errors';
import logger from 'infra/logger';

function createUmamiService() {
  const apiEndpoint = process.env.UMAMI_API_ENDPOINT || `${process.env.NEXT_PUBLIC_UMAMI_ENDPOINT}/api`;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const username = process.env.UMAMI_API_CLIENT_USERNAME || 'admin';
  const password = process.env.UMAMI_API_CLIENT_PASSWORD || 'umami';
  const apiKeys = [];

  while (process.env[`UMAMI_API_KEY_${apiKeys.length + 1}`]) {
    apiKeys.push(process.env[`UMAMI_API_KEY_${apiKeys.length + 1}`]);
  }

  apiKeys.sort(() => Math.random() - 0.5);

  const cache = {
    currentKeyIndex: 0,
  };

  cache.statsUrl = new URL(`${apiEndpoint}/websites/${websiteId}/stats`);
  cache.statsUrl.searchParams.append('startAt', 0);
  cache.statsUrl.searchParams.append('endAt', 8000000000000); // 2223-07-06T14:13:20.000Z

  async function getStatsByPath(path, attempt = 1) {
    const url = new URL(cache.statsUrl);
    url.searchParams.append('url', path);

    let response;

    try {
      response = await fetch(url, {
        headers: await getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();

        return {
          pageviews: data.pageviews?.value,
          visitors: data.visitors?.value,
          visits: data.visits?.value,
        };
      }

      if (response.status === 429) {
        throw new Error('Umami API rate limit exceeded');
      }

      throw new Error(`Failed to fetch data from Umami API: ${response.statusText}`);
    } catch (error) {
      const errorObject = new ServiceError({
        message: error.message || 'Failed to fetch data from Umami API',
        statusCode: response?.status,
        errorLocationCode: 'INFRA:ANALYTICS:GET_STATS_BY_PATH',
      });

      logger.error(snakeize(errorObject));

      if (attempt < apiKeys.length) {
        return await getStatsByPath(path, attempt + 1);
      }
    }
  }

  async function getHeaders() {
    if (apiKeys.length) {
      const apiKey = apiKeys[cache.currentKeyIndex];
      cache.currentKeyIndex = (cache.currentKeyIndex + 1) % apiKeys.length;

      return {
        'x-umami-api-key': apiKey,
      };
    }

    return {
      Authorization: await getAuthorization(),
    };
  }

  async function getAuthorization() {
    if (!cache.authorization) {
      const token = await fetch(`${apiEndpoint}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
        .then((res) => res.json())
        .then((data) => data.token);

      cache.authorization = `Bearer ${token}`;
    }

    return cache.authorization;
  }

  return Object.freeze({
    getStatsByPath,
  });
}

export default createUmamiService();
