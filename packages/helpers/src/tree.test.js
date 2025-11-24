import { findPathToNode, getSubtreeDepth, getSubtreeSize } from '.';

describe('helpers/tree', () => {
  describe('findPathToNode', () => {
    function isTarget(id) {
      return (node) => node?.id === id;
    }

    it('returns null for an empty tree', () => {
      expect(findPathToNode([], isTarget('target'))).toBeNull();
    });

    it('returns null if targetId is not found', () => {
      const nodes = [{ id: '1', children: [] }];
      expect(findPathToNode(nodes, isTarget('2'))).toBeNull();
    });

    it('returns path for a node with no children', () => {
      const nodes = [{ id: '1', children: [] }];
      expect(findPathToNode(nodes, isTarget('1'))).toStrictEqual(['1']);
    });

    it('returns path for a node with children', () => {
      const nodes = [
        { id: '1', children: [{ id: '2', children: [] }] },
        { id: '3', children: [] },
      ];
      expect(findPathToNode(nodes, isTarget('2'))).toStrictEqual(['1', '2']);
    });

    it('returns path for a deeply nested node', () => {
      const nodes = [{ id: '1', children: [{ id: '2', children: [{ id: '3', children: [] }] }] }];
      expect(findPathToNode(nodes, isTarget('3'))).toStrictEqual(['1', '2', '3']);
    });

    it('handles multiple levels of nesting correctly', () => {
      const nodes = [{ id: '1', children: [{ id: '2', children: [{ id: '3' }] }] }, { id: '4' }];
      expect(findPathToNode(nodes, isTarget('3'))).toStrictEqual(['1', '2', '3']);
    });
  });

  describe('getSubtreeDepth', () => {
    it('returns 0 for a null node', () => {
      expect(getSubtreeDepth(null)).toBe(0);
    });

    it('returns 1 for a leaf node', () => {
      const node = { children: [] };
      expect(getSubtreeDepth(node)).toBe(1);
    });

    it('returns 2 for a node with one child', () => {
      const node = { children: [{ children: [] }] };
      expect(getSubtreeDepth(node)).toBe(2);
    });

    it('returns 3 for a node with two levels of children', () => {
      const node = { children: [{ children: [{ children: [] }] }] };
      expect(getSubtreeDepth(node)).toBe(3);
    });

    it('returns max depth for a complex tree', () => {
      const node = {
        children: [
          { children: [] },
          { children: [{ children: [] }] },
          { children: [{ children: [{ children: [] }] }] },
        ],
      };
      expect(getSubtreeDepth(node)).toBe(4);
    });

    it('should treat non-array children as if the node has no children', () => {
      const node = { children: { a: { children: [] }, b: { children: [] } } };
      expect(getSubtreeDepth(node)).toBe(1);
    });
  });

  describe('getSubtreeSize', () => {
    it('returns 0 for a null node', () => {
      expect(getSubtreeSize(null)).toBe(0);
    });

    it('returns 1 for a leaf node when countCurrent is true (default)', () => {
      const node = { children: [] };
      expect(getSubtreeSize(node)).toBe(1);
    });

    it('returns 0 for a leaf node when countCurrent is false', () => {
      const node = { children: [] };
      expect(getSubtreeSize(node, false)).toBe(0);
    });

    it('returns selfCount plus children_deep_count when valid count is provided', () => {
      const node = { children_deep_count: 5, children: [] };
      // countCurrent true: 1 + 5 = 6
      expect(getSubtreeSize(node)).toBe(6);
      // countCurrent false: 0 + 5 = 5
      expect(getSubtreeSize(node, false)).toBe(5);
    });

    it('computes subtree size for a nested tree using children arrays', () => {
      const node = {
        children: [{ children: [] }, { children: [{ children: [] }, { children: [] }] }],
      };
      // Structure: root count=1, first child=1, second child=1+ (2 grandchildren)=2 => total=1+1+3 = 5
      expect(getSubtreeSize(node)).toBe(5);
    });

    it('computes subtree size for a mixed tree with children_deep_count and children arrays', () => {
      const node = {
        // children_deep_count valid, so should ignore deep traversal of children property
        children_deep_count: 4,
        children: [
          // Even if children array exists, function should not traverse
          { children: [] },
          { children: [] },
        ],
      };
      // countCurrent true: 1 + 4 = 5.
      expect(getSubtreeSize(node)).toBe(5);
    });
  });
});
