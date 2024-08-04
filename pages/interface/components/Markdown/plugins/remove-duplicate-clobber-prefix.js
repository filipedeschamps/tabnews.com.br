/**
 * Remove duplicate clobber prefix from id attributes
 * @param {Object} [options]
 * @param {string} [options.clobberPrefix='user-content-']
 * @returns {import('bytemd').BytemdPlugin}
 */
export function removeDuplicateClobberPrefix({ clobberPrefix = 'user-content-' }) {
  function process(element) {
    if (element.properties?.id) {
      element.properties.id = element.properties.id.replace(new RegExp(`^(${clobberPrefix}){2,}`), clobberPrefix);
    }

    if (element.children) {
      element.children.forEach((child) => process(child));
    }
  }

  return {
    rehype: (processor) => processor.use(() => (tree) => process(tree)),
  };
}
