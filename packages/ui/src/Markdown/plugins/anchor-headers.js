import rehypeSlug from 'rehype-slug';

/**
 * @param {(import('rehype-slug').Options | null | undefined)} options
 * @returns {import('bytemd').BytemdPlugin}
 */
export function anchorHeadersPlugin(options) {
  return {
    rehype: (processor) => processor.use(() => rehypeSlug(options)),
  };
}
