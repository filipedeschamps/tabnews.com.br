async function get(content) {
  if (process.env.NEXT_PUBLIC_UMAMI_ENABLED !== 'true') {
    return { metrics: [] };
  }

  if (!content || !content.created_at || !content.owner_username || !content.slug) {
    return { metrics: [] };
  }

  const startAt = new Date(content.created_at).getTime();
  const endAt = Date.now();
  const url = `/${content.owner_username}/${content.slug}`;

  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    url,
  });

  try {
    const res = await fetch(
      `https://api.umami.is/v1/websites/${process.env.NEXT_PUBLIC_UMAMI_ID_WEBSITE}/stats?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-umami-api-key': process.env.UMAMI_KEY,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      return { metrics: [] };
    }

    const data = await res.json();

    const metrics = {
      slug: url,
      infos: data,
    };

    return { metrics };
  } catch (error) {
    return { metrics: [] };
  }
}

export default Object.freeze({
  get,
});
