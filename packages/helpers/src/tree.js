/**
 * @typedef {Object} TreeNode
 * @property {TreeNode[]} [children]
 * @property {number} [children_deep_count]
 * @property {string} [id]
 */

/**
 * Returns a copy of the tree with `newNode` added to the children of the node matching `parentId`,
 * counting it on `children_deep_count` of that node and of every ancestor. The original tree is not
 * changed, and is returned as is when `parentId` is not found.
 * @param {TreeNode} node - The root node of the tree.
 * @param {TreeNode} newNode - The node to add.
 * @param {string} parentId - The ID of the node that receives the new node.
 * @returns {TreeNode} The new tree, or the original one when `parentId` is not found.
 */
export function addNodeToTree(node, newNode, parentId) {
  if (node.id === parentId) {
    return {
      ...node,
      children: [...(node.children ?? []), newNode],
      children_deep_count: (node.children_deep_count ?? 0) + 1,
    };
  }

  if (!node.children?.length) return node;

  const children = node.children.map((child) => addNodeToTree(child, newNode, parentId));
  if (children.every((child, index) => child === node.children[index])) return node;

  return { ...node, children, children_deep_count: (node.children_deep_count ?? 0) + 1 };
}

/**
 * Recursively searches a tree structure and returns the path to a node that matches a given predicate.
 * @param {TreeNode[]} nodes - The list of tree nodes to search through.
 * @param {(node: TreeNode) => boolean} isTarget - A predicate function that returns `true` for the target node.
 * @param {string[]} [path=[]] - The current path being accumulated during recursion (each entry represents a node ID).
 * @returns {string[] | null} An array of node IDs representing the path to the target node, or `null` if not found.
 */
export function findPathToNode(nodes, isTarget, path = []) {
  for (const node of nodes) {
    const currentPath = [...path, node?.id];

    if (isTarget(node)) return currentPath;

    if (node?.children) {
      const result = findPathToNode(node.children, isTarget, currentPath);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Calculates the maximum depth of the subtree rooted at the given node.
 *
 * The depth is defined as the number of nodes along the longest path
 * from the given node down to a leaf. A node with no children has depth 1.
 *
 * @param {TreeNode} node - The root node of the subtree.
 * @returns {number} The depth of the subtree. Returns 0 if the node is null or undefined.
 */
export function getSubtreeDepth(node) {
  if (!node) return 0;

  const children = Array.isArray(node.children) ? node.children : [];

  const maxChildDepth = children.reduce((max, child) => Math.max(max, getSubtreeDepth(child)), 0);

  return 1 + maxChildDepth;
}

/**
 * Calculates the size of a subtree rooted at the given node.
 * @param {TreeNode} node
 * @param {boolean} [countCurrent=true]
 * @returns {number}
 */
export function getSubtreeSize(node, countCurrent = true) {
  if (!node) return 0;

  const selfCount = countCurrent ? 1 : 0;

  if (typeof node.children_deep_count === 'number' && node.children_deep_count > 0) {
    return selfCount + node.children_deep_count;
  }

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return selfCount;
  }

  const childrenCount = node.children.reduce((total, child) => total + getSubtreeSize(child, true), 0);

  return selfCount + childrenCount;
}
