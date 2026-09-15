import { addNodeToTree, findPathToNode, getSubtreeDepth, getSubtreeSize, hasNode } from '.';

describe('helpers/tree', () => {
  describe('hasNode', () => {
    const tree = {
      id: 'root',
      children: [{ id: '1' }, { id: '2', children: [{ id: '3' }] }],
    };

    it('returns true when the id matches the root', () => {
      expect(hasNode(tree, 'root')).toBe(true);
    });

    it('returns true when the id matches a direct child', () => {
      expect(hasNode(tree, '1')).toBe(true);
    });

    it('returns true when the id matches a nested descendant', () => {
      expect(hasNode(tree, '3')).toBe(true);
    });

    it('returns false when the id is not found', () => {
      expect(hasNode(tree, 'missing')).toBe(false);
    });

    it('returns false for a nullish tree', () => {
      expect(hasNode(null, 'root')).toBe(false);
      expect(hasNode(undefined, 'root')).toBe(false);
    });
  });

  describe('addNodeToTree', () => {
    const newNode = { id: 'new' };

    it('adds the node to the children of the root', () => {
      const tree = { id: 'root', children: [{ id: '1' }], children_deep_count: 1 };

      expect(addNodeToTree(tree, newNode, 'root')).toStrictEqual({
        id: 'root',
        children: [{ id: '1' }, newNode],
        children_deep_count: 2,
      });
    });

    it('adds the node to a root without children', () => {
      expect(addNodeToTree({ id: 'root' }, newNode, 'root')).toStrictEqual({
        id: 'root',
        children: [newNode],
        children_deep_count: 1,
      });
    });

    it('adds the node to a content without any child yet', () => {
      const tree = { id: 'root', children: [], children_deep_count: 0 };

      expect(addNodeToTree(tree, newNode, 'root')).toStrictEqual({
        id: 'root',
        children: [newNode],
        children_deep_count: 1,
      });
    });

    it('adds the node to a nested parent and counts it on every ancestor', () => {
      const tree = {
        id: 'root',
        children: [
          { id: '1', children_deep_count: 0 },
          { id: '2', children: [{ id: '3', children_deep_count: 0 }], children_deep_count: 1 },
        ],
        children_deep_count: 3,
      };

      expect(addNodeToTree(tree, newNode, '3')).toStrictEqual({
        id: 'root',
        children: [
          { id: '1', children_deep_count: 0 },
          {
            id: '2',
            children: [{ id: '3', children: [newNode], children_deep_count: 1 }],
            children_deep_count: 2,
          },
        ],
        children_deep_count: 4,
      });
    });

    it('adds the node to the last of a chain of children, counting it on every ancestor', () => {
      const tree = {
        id: 'root',
        children_deep_count: 3,
        children: [
          {
            id: '1',
            children_deep_count: 2,
            children: [
              { id: '2', children_deep_count: 1, children: [{ id: '3', children_deep_count: 0, children: [] }] },
            ],
          },
        ],
      };

      const newTree = addNodeToTree(tree, newNode, '3');
      const [first] = newTree.children;
      const [second] = first.children;
      const [third] = second.children;

      expect(third.children).toStrictEqual([newNode]);
      expect([newTree, first, second, third].map((node) => node.children_deep_count)).toStrictEqual([4, 3, 2, 1]);
    });

    it('returns the same tree when the parent is not found', () => {
      const tree = { id: 'root', children: [{ id: '1' }] };

      expect(addNodeToTree(tree, newNode, 'other')).toBe(tree);
    });

    it('adds the node without changing the tree it received', () => {
      const tree = { id: 'root', children: [{ id: '1' }], children_deep_count: 1 };

      addNodeToTree(tree, newNode, '1');

      expect(tree).toStrictEqual({ id: 'root', children: [{ id: '1' }], children_deep_count: 1 });
    });
  });

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
