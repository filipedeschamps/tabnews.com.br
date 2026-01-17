import rehypeExternalLinks from 'rehype-external-links';

/**
 * @param {Object} [params]
 * @param {(url?: string) => boolean} [params.shouldAddNofollow] - Returns `true` to add `nofollow`. Defaults to always `true`.
 * @param {import('rehype-external-links').Options} [params.options] - Options passed to `rehype-external-links`.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function externalLinksPlugin({ shouldAddNofollow = () => true, options = {} } = {}) {
  /**
   * @param {import('hast').Element} element
   * @returns {string[]}
   */
  function createRel(element) {
    const rel = [];
    const url = element.properties?.href;
    if (!url) return rel;

    if (shouldAddNofollow(url)) {
      rel.push('nofollow');
    }

    if (element.properties.target === '_blank') {
      rel.push('noopener');
    }

    return rel;
  }

  return {
    rehype: (processor) => processor.use(() => rehypeExternalLinks({ rel: createRel, ...options })),
  };
}
