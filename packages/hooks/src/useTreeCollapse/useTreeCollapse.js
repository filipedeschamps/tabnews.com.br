import { getSubtreeSize } from '@tabnews/helpers';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @typedef {Object} TreeNode
 * @property {string} id - Unique identifier for the node.
 * @property {TreeNode[]} [children] - Child nodes of the current node.
 * @property {number} [children_deep_count] - Total number of nested children.
 * @property {number} [collapsedSize] - Render size when the node is collapsed.
 * @property {number} [expandedSize] - Render size when the node is expanded.
 */

/**
 * @typedef {Object} useTreeCollapseReturn
 * @property {TreeNode[]} nodeStates - The current computed state of the first-level children of the tree.
 * @property {(id: string) => void} handleExpand - Expands a node and adjusts visibility of related nodes based on budget constraints.
 * @property {(id: string) => void} handleCollapse - Collapses a node's immediate children by its ID.
 */

/**
 * @typedef {Object} useTreeCollapseParams
 * @property {TreeNode[]} [nodes=[]] - The initial list of tree nodes.
 * @property {number} [minimalSubTree=3] - The minimum size of a subtree to be expanded.
 * @property {number} [totalBudget=20] - The total node rendering budget available.
 * @property {number} [additionalBudget=10] - The additional budget allocated when expanding a node.
 * @property {string|null} [defaultExpandedId=null] - The ID of the node to expand by default.
 */

/**
 * Hook to manage collapse/expand logic for the first children level of a tree structure,
 * using rendering budget constraints. It returns all tree nodes annotated with their current
 * expansion state, along with handlers to toggle visibility.
 *
 * @param {useTreeCollapseParams} [params] - Parameters to configure the tree collapse behavior.
 * @returns {useTreeCollapseReturn} - All nodes with computed expansion metadata and controls to modify their state.
 */
export function useTreeCollapse({
  nodes = [],
  minimalSubTree = 3,
  totalBudget = 20,
  additionalBudget = 10,
  defaultExpandedId = null,
} = {}) {
  const lastParamsRef = useRef({ totalBudget, minimalSubTree, defaultExpandedId });

  const [nodeStates, setNodeStates] = useState(() =>
    computeNodeStates({
      minimalSubTree,
      nodes,
      totalBudget,
      defaultExpandedId,
    }),
  );

  useEffect(() => {
    const shouldUsePrevious =
      lastParamsRef.current.totalBudget === totalBudget &&
      lastParamsRef.current.minimalSubTree === minimalSubTree &&
      lastParamsRef.current.defaultExpandedId === defaultExpandedId;

    if (shouldUsePrevious) {
      setNodeStates((previousState) =>
        computeNodeStates({
          minimalSubTree,
          nodes,
          previousState,
          totalBudget,
          defaultExpandedId,
        }),
      );
    } else {
      lastParamsRef.current = { totalBudget, minimalSubTree, defaultExpandedId };
      setNodeStates(
        computeNodeStates({
          minimalSubTree,
          nodes,
          totalBudget,
          defaultExpandedId,
        }),
      );
    }
  }, [defaultExpandedId, nodes, minimalSubTree, totalBudget]);

  const handleExpand = useCallback(
    (targetId) => {
      setNodeStates((previousState) =>
        expandChildren({
          additionalBudget,
          minimalSubTree,
          previousState,
          targetId,
        }),
      );
    },
    [additionalBudget, minimalSubTree],
  );

  const handleCollapse = useCallback((targetId) => {
    setNodeStates((previousState) =>
      collapseChildren({
        previousState,
        targetId,
      }),
    );
  }, []);

  return {
    handleCollapse,
    handleExpand,
    nodeStates,
  };
}

/**
 * Computes the initial state of tree nodes based on budget constraints and previous state.
 *
 * @param {Object} params
 * @param {number} [params.minimalSubTree=1] - Minimum size of a subtree to be expanded
 * @param {TreeNode[]} params.nodes - Array of tree nodes to process
 * @param {TreeNode[]} [params.previousState=[]] - Previous state to maintain expanded sizes
 * @param {number} params.totalBudget - Total budget available for node expansion
 * @param {string|null} [params.defaultExpandedId=null] - ID of the node to expand by default
 * @returns {TreeNode[]} Array of nodes with computed expansion states
 */
export function computeNodeStates({
  minimalSubTree = 1,
  nodes,
  previousState = [],
  totalBudget,
  defaultExpandedId = null,
}) {
  if (!nodes || !Array.isArray(nodes) || !nodes.length) return nodes;

  let remainingBudget = totalBudget;

  const previousExpandedSizes = new Map(
    previousState
      .filter((node) => typeof node?.id === 'string' && typeof node.expandedSize === 'number')
      .map((node) => [node.id, node.expandedSize]),
  );

  const initialPass = nodes.map((node) => {
    if (typeof node?.id !== 'string') return node;

    const cachedExpandedSize = previousExpandedSizes.get(node.id);

    if (cachedExpandedSize >= 0) {
      remainingBudget -= cachedExpandedSize;
      return { ...node, expandedSize: cachedExpandedSize };
    }

    if (remainingBudget > 0 || node.id === defaultExpandedId) {
      const maxFullDepth = getSubtreeSize(node);
      const allocated = Math.max(1, Math.min(minimalSubTree, remainingBudget, maxFullDepth));
      remainingBudget -= allocated;
      return { ...node, expandedSize: allocated };
    }

    return { ...node, expandedSize: 0 };
  });

  const grouped = groupCollapsed(initialPass);
  return distributeRemainingBudget(grouped, remainingBudget);
}

/**
 * Groups consecutive collapsed nodes and calculates their combined collapsed size.
 *
 * @param {TreeNode[]} nodes - Array of nodes to process
 * @returns {TreeNode[]} Array with collapsed nodes grouped together
 */
function groupCollapsed(nodes) {
  const result = [];
  let i = 0;

  while (i < nodes?.length) {
    const node = nodes[i];

    if (node?.expandedSize === 0) {
      let collapsedSize = getSubtreeSize(node);
      let j = i + 1;

      // Find consecutive collapsed nodes
      while (j < nodes.length && nodes[j]?.expandedSize === 0) {
        collapsedSize += getSubtreeSize(nodes[j]);
        j++;
      }

      // Add the first node with combined collapsed size
      result.push({ ...node, collapsedSize });

      // Add remaining nodes in the group without collapsedSize
      for (let k = i + 1; k < j; k++) {
        result.push({ ...nodes[k] });
      }

      i = j;
    } else {
      result.push(node);
      i++;
    }
  }

  return result;
}

/**
 * Distributes any remaining budget across nodes that can still be expanded.
 *
 * @param {TreeNode[]} nodes - Array of nodes to distribute budget to
 * @param {number} remainingBudget - Amount of budget still available
 * @returns {TreeNode[]} Array of nodes with updated expanded sizes
 */
function distributeRemainingBudget(nodes, remainingBudget) {
  if (remainingBudget <= 0) return nodes;

  return nodes.map((node) => {
    if (remainingBudget <= 0 || !node?.expandedSize) return node;

    const maxDepth = node.collapsedSize || getSubtreeSize(node);

    if (node.expandedSize >= maxDepth) return node;

    const extra = Math.min(remainingBudget, maxDepth - node.expandedSize);
    remainingBudget -= extra;

    return {
      ...node,
      expandedSize: node.expandedSize + extra,
    };
  });
}

/**
 * Expands collapsed children of a target node by allocating additional budget.
 * This function finds consecutive collapsed nodes starting from the target and expands them.
 *
 * @param {Object} params - Parameters for expansion
 * @param {number} params.additionalBudget - Additional budget to allocate for expansion
 * @param {number} params.minimalSubTree - Minimum size for subtree expansion
 * @param {TreeNode[]} params.previousState - Current state of all nodes
 * @param {string} params.targetId - ID of the target node to expand
 * @returns {TreeNode[]} Updated array with expanded nodes
 */
function expandChildren({ additionalBudget, minimalSubTree, previousState, targetId }) {
  const startIndex = previousState.findIndex((node) => node?.id === targetId);
  if (startIndex < 0) return previousState;

  const nodes = [];
  let endIndex = startIndex;

  // Collect consecutive collapsed nodes
  while (previousState[endIndex]?.expandedSize === 0) {
    const { collapsedSize, ...nodeWithoutCollapsedSize } = previousState[endIndex];
    nodes.push(nodeWithoutCollapsedSize);
    endIndex++;
  }

  const expanded = computeNodeStates({
    minimalSubTree,
    nodes,
    totalBudget: additionalBudget,
  });

  return [...previousState.slice(0, startIndex), ...expanded, ...previousState.slice(endIndex)];
}

/**
 * Collapses a node and updates the collapsed size information for adjacent collapsed nodes.
 *
 * @param {Object} params - Parameters for collapsing
 * @param {TreeNode[]} params.previousState - Current state of all nodes
 * @param {string} params.targetId - ID of the target node to collapse
 * @returns {TreeNode[]} Updated array with collapsed node
 */
function collapseChildren({ previousState, targetId }) {
  const targetNodeIndex = previousState.findIndex((node) => node?.id === targetId);
  if (targetNodeIndex < 0 || previousState[targetNodeIndex].expandedSize === 0) return previousState;

  const result = [...previousState];
  const originalTargetNode = result[targetNodeIndex];
  const targetNode = {
    ...originalTargetNode,
    // Collapse the target node
    expandedSize: 0,
    collapsedSize: getSubtreeSize(originalTargetNode),
  };
  result[targetNodeIndex] = targetNode;

  // Update collapsed size if next node is also collapsed
  if (result[targetNodeIndex + 1]?.collapsedSize) {
    targetNode.collapsedSize += result[targetNodeIndex + 1].collapsedSize;
    const nextNode = { ...result[targetNodeIndex + 1] };
    delete nextNode.collapsedSize;
    result[targetNodeIndex + 1] = nextNode;
  }

  // Find the first collapsed node in the sequence (going backwards)
  let firstCollapsedIndex = targetNodeIndex;
  while (result[firstCollapsedIndex - 1]?.expandedSize === 0) {
    firstCollapsedIndex--;
  }

  // If target is not the first collapsed node, move collapsedSize to the first one
  if (firstCollapsedIndex < targetNodeIndex) {
    const totalCollapsedSize = result[firstCollapsedIndex].collapsedSize + targetNode.collapsedSize;
    const firstNode = { ...result[firstCollapsedIndex], collapsedSize: totalCollapsedSize };
    result[firstCollapsedIndex] = firstNode;
    delete targetNode.collapsedSize;
  }

  return result;
}
