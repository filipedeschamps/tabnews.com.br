import rehypeExternalLinks from 'rehype-external-links';

import { isTrustedDomain } from 'pages/interface';

/**
 * @param {(import('rehype-external-links').Options | null | undefined)} options
 * @returns {import('bytemd').BytemdPlugin}
 */
export function externalLinksPlugin(options) {
  /**
   * @param {(import('hast').Element)} element
   * @returns {Array<string> | string | null | undefined}
   */
  function createRel(element) {
    const rel = [];
    const url = element.properties.href;
    if (url) {
      if (!isTrustedDomain(url)) {
        rel.push('nofollow');
      }
      if (element.properties.target === '_blank') {
        rel.push('noopener');
      }
    }
    return rel;
  }

  return {
    rehype: (processor) => processor.use(() => rehypeExternalLinks({ rel: createRel, ...options })),
  };
}
