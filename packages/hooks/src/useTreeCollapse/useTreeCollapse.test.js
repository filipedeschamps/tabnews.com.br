import { act, renderHook } from '@testing-library/react';

import { computeNodeStates, useTreeCollapse } from '.';

describe('hooks/useTreeCollapse', () => {
  const subChildren = [
    { id: '1.1', children_deep_count: 0 },
    { id: '1.2', children_deep_count: 0 },
  ];

  const nodes = [
    { id: '0', children_deep_count: 0 },
    {
      id: '1',
      children_deep_count: 2,
      children: subChildren,
    },
    { id: '2', children_deep_count: 0 },
    { id: '3', children_deep_count: 0 },
  ];

  describe('initialization', () => {
    it('should initialize with an empty state by default', () => {
      const { result } = renderHook(() => useTreeCollapse());

      expect(result.current).toStrictEqual({
        nodeStates: [],
        handleCollapse: expect.any(Function),
        handleExpand: expect.any(Function),
      });
    });

    it('should initialize with provided nodes', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));

      const expectedState = [
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 3,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ];

      expect(result.current).toStrictEqual({
        nodeStates: expectedState,
        handleCollapse: expect.any(Function),
        handleExpand: expect.any(Function),
      });
    });

    it('initializes nodeStates with undefined collapsedSize for all children not collapsed', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));
      const states = result.current.nodeStates;

      states.forEach((child) => {
        expect(child.collapsedSize).toBeUndefined();
      });
    });

    it('should respect totalBudget by collapsing excess children', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes, totalBudget: 5 }));

      expect(result.current.nodeStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 3,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it('should respect minimalSubTree by reserving the necessary nodes for the first children', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes, minimalSubTree: 2, totalBudget: 4 }));

      expect(result.current.nodeStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 2,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it('should distribute the extra remaining budget among the nodes', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes, totalBudget: 10, minimalSubTree: 1 }));
      const states = result.current.nodeStates;

      nodes.forEach((child, index) => {
        expect(states[index].expandedSize).toBeGreaterThanOrEqual(child.children_deep_count + 1);
      });
    });

    it('should not collapse the child with defaultExpandedId', () => {
      const { result } = renderHook(() =>
        useTreeCollapse({ nodes, totalBudget: 2, minimalSubTree: 2, defaultExpandedId: '2' }),
      );

      expect(result.current.nodeStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 1,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 }, // '2' is not collapsed
        { ...nodes[3], expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it.todo('should not collapse the child with defaultExpandedId for deep children', () => {
      const subChildrenWithNonCollapsible = [
        {
          id: '1.1',
          children_deep_count: 3,
          children: [
            {
              id: '1.1.1',
              children_deep_count: 2,
              children: [
                { id: '1.1.1.1', children_deep_count: 0 },
                { id: '1.1.1.2', children_deep_count: 0 },
              ],
            },
          ],
        },
      ];

      const nodesWithNonCollapsible = [
        nodes[0],
        {
          id: '1',
          children_deep_count: 4,
          children: subChildrenWithNonCollapsible,
        },
        nodes[2],
        nodes[3],
      ];

      const { result } = renderHook(() =>
        useTreeCollapse({
          nodes: nodesWithNonCollapsible,
          totalBudget: 5,
          minimalSubTree: 3,
          defaultExpandedId: '1.1.1.2',
        }),
      );
      const states = result.current.nodeStates;

      expect(states).toHaveLength(nodesWithNonCollapsible.length);
      expect(states).toStrictEqual([
        { ...nodesWithNonCollapsible[0], expandedSize: 1 },
        {
          ...nodesWithNonCollapsible[1],
          expandedSize: 4, // '1.1.1.2' is expected to be expanded, so its ancestors '1', '1.1', and '1.1.1' must also be expanded
        },
        { ...nodesWithNonCollapsible[2], expandedSize: 0, collapsedSize: 2 },
        { ...nodesWithNonCollapsible[3], expandedSize: 0 },
      ]);
    });

    it('handles children with no children_deep_count', () => {
      const childrenWithNoDeepCount = [{ id: '1' }, { id: '2' }];
      const { result } = renderHook(() => useTreeCollapse({ nodes: childrenWithNoDeepCount }));

      expect(result.current.nodeStates).toStrictEqual([
        { id: '1', expandedSize: 1 },
        { id: '2', expandedSize: 1 },
      ]);
    });

    it('handles a sibling collapsed without children_deep_count', () => {
      const nodesWithSibling = [
        { id: '0', children_deep_count: 0 },
        { id: '1' }, // No children_deep_count
        { id: '2', children_deep_count: 0 },
      ];
      const { result } = renderHook(() => useTreeCollapse({ nodes: nodesWithSibling }));

      act(() => {
        result.current.handleCollapse('0');
      });
      act(() => {
        result.current.handleCollapse('1');
      });
      act(() => {
        result.current.handleCollapse('2');
      });

      const states = result.current.nodeStates;
      expect(states).toHaveLength(nodesWithSibling.length);
      expect(states).toStrictEqual([
        { ...nodesWithSibling[0], expandedSize: 0, collapsedSize: 3 },
        { ...nodesWithSibling[1], expandedSize: 0 },
        { ...nodesWithSibling[2], expandedSize: 0 },
      ]);
    });

    it('handles children with negative children_deep_count', () => {
      const childrenWithNegativeDeepCount = [
        { id: '1', children_deep_count: -2 },
        { id: '2', children_deep_count: 0 },
      ];
      const { result } = renderHook(() => useTreeCollapse({ nodes: childrenWithNegativeDeepCount }));

      expect(result.current.nodeStates).toStrictEqual([
        { id: '1', children_deep_count: -2, expandedSize: 1 },
        { id: '2', children_deep_count: 0, expandedSize: 1 },
      ]);
    });

    it('initializes with empty children state if nodes is empty', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes: [] }));
      const states = result.current.nodeStates;
      expect(states).toHaveLength(0);
      expect(states).toStrictEqual([]);
    });

    it('initializes with empty children state if nodes is undefined', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes: undefined }));

      expect(result.current.nodeStates).toStrictEqual([]);
    });

    it('initializes with null children state if nodes is null', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes: null }));
      const states = result.current.nodeStates;

      expect(states).toBeNull();
    });

    it('initializes with empty object children state if nodes is an empty object', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes: {} }));
      const states = result.current.nodeStates;

      expect(states).toStrictEqual({});
    });

    it('initializes with undefined child state if nodes contain only one undefined item', () => {
      const nodes = [undefined];

      const { result } = renderHook(() => useTreeCollapse({ nodes }));
      const states = result.current.nodeStates;

      expect(states).toStrictEqual(nodes);
    });

    it('initializes with empty object children state if nodes contains an empty object', () => {
      const nodes = [{}];

      const { result } = renderHook(() => useTreeCollapse({ nodes, totalBudget: 3, minimalSubTree: 3 }));
      const states = result.current.nodeStates;

      expect(states).toStrictEqual(nodes);
    });
  });

  describe('parameter changes', () => {
    it('updates children state when nodes changes (new children added)', () => {
      const { result, rerender } = renderHook(({ nodes }) => useTreeCollapse({ nodes }), {
        initialProps: { nodes },
      });
      const initialStates = result.current.nodeStates;
      const newChildrenList = [...nodes, { id: '5', children_deep_count: 0 }];
      rerender({ nodes: newChildrenList });
      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(newChildrenList.length);
      expect(updatedStates).not.toStrictEqual(initialStates);
      expect(updatedStates).toStrictEqual([
        { ...newChildrenList[0], expandedSize: 1 },
        {
          ...newChildrenList[1],
          expandedSize: 3,
          children: subChildren,
        },
        { ...newChildrenList[2], expandedSize: 1 },
        { ...newChildrenList[3], expandedSize: 1 },
        { ...newChildrenList[4], expandedSize: 1 },
      ]);
    });

    it('updates children state when nodes changes (children removed)', () => {
      const { result, rerender } = renderHook(({ nodes }) => useTreeCollapse({ nodes }), {
        initialProps: { nodes },
      });
      const initialStates = result.current.nodeStates;
      const newChildrenList = [nodes[0], nodes[1]];
      rerender({ nodes: newChildrenList });
      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(newChildrenList.length);
      expect(updatedStates).not.toStrictEqual(initialStates);
      expect(updatedStates).toStrictEqual([
        { ...newChildrenList[0], expandedSize: 1 },
        {
          ...newChildrenList[1],
          expandedSize: 3,
          children: subChildren,
        },
      ]);
    });

    it('updates children state when nodes changes (children reordered)', () => {
      const { result, rerender } = renderHook(({ nodes }) => useTreeCollapse({ nodes }), {
        initialProps: { nodes },
      });
      const initialStates = result.current.nodeStates;
      const newChildrenList = [nodes[2], nodes[0], nodes[1]];
      rerender({ nodes: newChildrenList });
      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(newChildrenList.length);
      expect(updatedStates).not.toStrictEqual(initialStates);
      expect(updatedStates).toStrictEqual([
        { ...newChildrenList[0], expandedSize: 1 },
        {
          ...newChildrenList[1],
          expandedSize: 1,
        },
        { ...newChildrenList[2], expandedSize: 3, children: subChildren },
      ]);
    });

    it('should preserve collapsed state when nodes is reordered', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useTreeCollapse({ nodes, totalBudget: 20, minimalSubTree: 2 }),
        { initialProps: { nodes } },
      );

      act(() => {
        result.current.handleCollapse('1');
        result.current.handleCollapse('3');
      });

      const reorderedList = [nodes[2], nodes[1], nodes[3], nodes[0]];
      rerender({ nodes: reorderedList });
      const stateAfterReorder = result.current.nodeStates;

      expect(stateAfterReorder).toStrictEqual([
        { ...reorderedList[0], expandedSize: 1 },
        {
          ...reorderedList[1],
          expandedSize: 0,
          collapsedSize: 4,
          children: subChildren,
        },
        { ...reorderedList[2], expandedSize: 0 },
        { ...reorderedList[3], expandedSize: 1 },
      ]);
    });

    it('updates children state when nodes changes (children reordered with collapsed state)', () => {
      const { result, rerender } = renderHook(({ nodes }) => useTreeCollapse({ nodes }), {
        initialProps: { nodes },
      });

      act(() => {
        result.current.handleCollapse('2');
      });

      expect(result.current.nodeStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 3,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 0, collapsedSize: 1 }, // ID '2' is collapsed
        { ...nodes[3], expandedSize: 1 },
      ]);

      const newChildrenList = [nodes[3], nodes[2], nodes[1], nodes[0]];

      rerender({ nodes: newChildrenList });

      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(newChildrenList.length);

      expect(updatedStates).toStrictEqual([
        { ...newChildrenList[0], expandedSize: 1 },
        { ...newChildrenList[1], expandedSize: 0, collapsedSize: 1 }, // ID '2' is still collapsed
        {
          ...newChildrenList[2],
          expandedSize: 3,
          children: subChildren,
        },
        { ...newChildrenList[3], expandedSize: 1 },
      ]);
    });

    it('should not consider the previous state if the totalBudget changes', () => {
      const { result, rerender } = renderHook(({ totalBudget }) => useTreeCollapse({ nodes, totalBudget }), {
        initialProps: { totalBudget: 20 },
      });
      const initialStates = result.current.nodeStates;
      rerender({ totalBudget: 2 });
      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 1,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 0, collapsedSize: 2 },
        { ...nodes[3], expandedSize: 0 },
      ]);
      expect(updatedStates).not.toStrictEqual(initialStates);
    });

    it('should not consider the previous state if minimalSubTree changes', () => {
      const { result, rerender } = renderHook(
        ({ minimalSubTree }) => useTreeCollapse({ nodes, totalBudget: 4, minimalSubTree }),
        {
          initialProps: { minimalSubTree: 3 },
        },
      );
      const initialStates = result.current.nodeStates;
      rerender({ minimalSubTree: 2 });
      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 2,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 0, collapsedSize: 1 },
      ]);
      expect(updatedStates).not.toStrictEqual(initialStates);
    });
  });

  describe('handleCollapse', () => {
    it('collapses a node correctly', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));

      act(() => {
        result.current.handleCollapse('1');
      });

      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(nodes.length);
      expect(updatedStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 0,
          collapsedSize: 3,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);
    });

    it('does nothing if handleCollapse is called with an invalid id', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));
      const prevState = result.current.nodeStates;

      act(() => {
        result.current.handleCollapse('non-existent-id');
      });

      expect(result.current.nodeStates).toStrictEqual(prevState);
    });

    it('does not collapse if child is already collapsed', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));

      act(() => {
        result.current.handleCollapse('1');
      });
      const stateAfterFirstCollapse = result.current.nodeStates;

      act(() => {
        result.current.handleCollapse('1');
      });
      const stateAfterSecondCollapse = result.current.nodeStates;

      expect(stateAfterSecondCollapse).toStrictEqual(stateAfterFirstCollapse);
    });

    it('correctly updates collapsedSize when collapsing multiple consecutive children', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));

      // Collapse '0', then '1'
      act(() => {
        result.current.handleCollapse('0');
      });
      act(() => {
        result.current.handleCollapse('1');
      });

      const states = result.current.nodeStates;

      // Node '0' should have collapsedSize increased by node '1'
      expect(states[0]).toStrictEqual({
        ...nodes[0],
        expandedSize: 0,
        collapsedSize: 4, // '0', '1', '1.1', and '1.2'
      });
      expect(states[1]).toStrictEqual({
        ...nodes[1],
        expandedSize: 0,
      });
    });

    it('collapses a child and updates the state correctly when collapsing a previous sibling', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));
      // Collapse child '1'
      act(() => {
        result.current.handleCollapse('1');
      });
      const stateAfterCollapse = result.current.nodeStates;
      const collapsedChild = stateAfterCollapse[1];

      expect(collapsedChild).toStrictEqual({
        ...nodes[1],
        expandedSize: 0,
        collapsedSize: 3, // '1', '1.1' and '1.2'
      });

      // Collapse child '0'
      act(() => {
        result.current.handleCollapse('0');
      });

      const stateAfterSecondCollapse = result.current.nodeStates;

      expect(stateAfterSecondCollapse).toStrictEqual([
        { ...nodes[0], expandedSize: 0, collapsedSize: 4 }, // '0', '1', '1.1' and '1.2'
        { ...nodes[1], expandedSize: 0 },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);
    });

    it('collapses multiple non-adjacent nodes and then collapses the node between them', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));

      // Collapse node '0' and '2'
      act(() => {
        result.current.handleCollapse('0');
        result.current.handleCollapse('2');
      });
      const stateAfterCollapse = result.current.nodeStates;

      expect(stateAfterCollapse).toStrictEqual([
        { ...nodes[0], expandedSize: 0, collapsedSize: 1 }, // '0'
        {
          ...nodes[1],
          expandedSize: 3, // '1', '1.1', and '1.2' are still expanded
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 0, collapsedSize: 1 }, // '2'
        { ...nodes[3], expandedSize: 1 }, // '3'
      ]);

      // Collapse node '1'
      act(() => {
        result.current.handleCollapse('1');
      });

      const stateAfterCollapseNode1 = result.current.nodeStates;

      expect(stateAfterCollapseNode1).toStrictEqual([
        { ...nodes[0], expandedSize: 0, collapsedSize: 5 }, // '0', '1', '1.1', '1.2', and '2'
        { ...nodes[1], expandedSize: 0 },
        { ...nodes[2], expandedSize: 0 },
        { ...nodes[3], expandedSize: 1 }, // '3'
      ]);
    });
  });

  describe('handleExpand', () => {
    it('expands a node by exactly the additionalBudget', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes, additionalBudget: 2 }));

      const initialStates = result.current.nodeStates;

      expect(initialStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 3,
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);

      // First, collapse child '1'
      act(() => {
        result.current.handleCollapse('1');
      });

      // Then, expand child '1'
      act(() => {
        result.current.handleExpand('1');
      });
      const stateAfterExpand = result.current.nodeStates;

      expect(stateAfterExpand).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 2, // Respecting additionalBudget
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);
    });

    it('expands only the additionalBudget when expanding grouped nodes', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes, additionalBudget: 2 }));

      // Collapse both '0' and '1'
      act(() => {
        result.current.handleCollapse('0');
        result.current.handleCollapse('1');
      });

      const initialStates = result.current.nodeStates;
      expect(initialStates).toStrictEqual([
        { ...nodes[0], expandedSize: 0, collapsedSize: 4 }, // '0', '1', '1.1', and '1.2'
        { ...nodes[1], expandedSize: 0 },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);

      // Expand only '0'
      act(() => {
        result.current.handleExpand('0');
      });

      const updatedStates = result.current.nodeStates;

      expect(updatedStates).toHaveLength(nodes.length);
      expect(updatedStates).toStrictEqual([
        { ...nodes[0], expandedSize: 1 },
        {
          ...nodes[1],
          expandedSize: 1, // '1.1' and '1.2' are still collapsed
          children: subChildren,
        },
        { ...nodes[2], expandedSize: 1 },
        { ...nodes[3], expandedSize: 1 },
      ]);
    });

    it('does not change state when handleExpand is called with an invalid id', () => {
      const { result } = renderHook(() => useTreeCollapse({ nodes }));
      const prevState = result.current.nodeStates;

      act(() => {
        result.current.handleExpand('non-existent-id');
      });

      expect(result.current.nodeStates).toStrictEqual(prevState);
    });
  });

  describe('computeNodeStates', () => {
    const nodes = [
      { id: 'a', children_deep_count: 0 },
      { id: 'b', children_deep_count: 1 },
      { id: 'c', children_deep_count: 0 },
    ];

    it('should compute node states respecting minimalSubTree', () => {
      const result = computeNodeStates({ nodes, totalBudget: 3 }); // minimalSubTree is 1 by default

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 1, expandedSize: 1 },
        { id: 'c', children_deep_count: 0, expandedSize: 1 },
      ]);
    });

    it('should compute node states respecting totalBudget', () => {
      const result = computeNodeStates({ nodes, totalBudget: 2 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 1, expandedSize: 1 },
        { id: 'c', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it('should compute node states with minimalSubTree and totalBudget', () => {
      const result = computeNodeStates({ nodes, totalBudget: 3, minimalSubTree: 2 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 1, expandedSize: 2 },
        { id: 'c', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it('returns empty array if nodes is empty', () => {
      expect(computeNodeStates({ nodes: [], totalBudget: 3 })).toStrictEqual([]);
    });

    it('groups collapsed children and sets collapsedSize correctly', () => {
      const result = computeNodeStates({ nodes, totalBudget: 1, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 1, expandedSize: 0, collapsedSize: 3 },
        { id: 'c', children_deep_count: 0, expandedSize: 0 },
      ]);
    });

    it('uses previousState to preserve collapsed/expanded state', () => {
      const nodes = [
        { id: 'a', children_deep_count: 0 },
        { id: 'b', children_deep_count: 0 },
      ];
      const previousState = [
        { id: 'a', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
        { id: 'b', children_deep_count: 0, expandedSize: 1 },
      ];

      const result = computeNodeStates({ nodes, totalBudget: 2, previousState, minimalSubTree: 1 });

      expect(result[0].expandedSize).toBe(0);
      expect(result[1].expandedSize).toBe(1);
    });

    it('handles children reordered with previousState', () => {
      const nodes = [
        { id: 'b', children_deep_count: 0 },
        { id: 'a', children_deep_count: 0 },
      ];
      const previousState = [
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
      ];
      const result = computeNodeStates({ nodes, totalBudget: 2, previousState, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        previousState[1], // 'b' is now first
        previousState[0], // 'a' is now second
      ]);
    });

    it('correctly increases collapsedSize for collapsed siblings', () => {
      const nodes = [
        { id: '1', children_deep_count: 0 },
        { id: '3', children_deep_count: 0 },
        { id: '2', children_deep_count: 2 },
      ];
      const previousState = [
        { id: '1', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
        { id: '2', children_deep_count: 2, expandedSize: 3 },
        { id: '3', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
      ];

      const result = computeNodeStates({ nodes, totalBudget: 4, previousState, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        { id: '1', children_deep_count: 0, expandedSize: 0, collapsedSize: 2 }, // '1' and '3' are siblings
        { id: '3', children_deep_count: 0, expandedSize: 0 },
        { id: '2', children_deep_count: 2, expandedSize: 3 },
      ]);
    });

    it('does not mutate input nodes or previousState', () => {
      const nodes = [
        { id: 'x', children_deep_count: 0 },
        { id: 'y', children_deep_count: 1 },
      ];
      const previousState = [
        { id: 'x', children_deep_count: 0, expandedSize: 1 },
        { id: 'y', children_deep_count: 0, expandedSize: 1 },
      ];
      const nodesCopy = JSON.parse(JSON.stringify(nodes));
      const previousStateCopy = JSON.parse(JSON.stringify(previousState));

      const result = computeNodeStates({ nodes, totalBudget: 1, previousState, minimalSubTree: 1 });

      expect(nodes).toStrictEqual(nodesCopy);
      expect(result).not.toStrictEqual(nodes);
      expect(previousState).toStrictEqual(previousStateCopy);
      expect(result).not.toStrictEqual(previousState);
    });

    it('computes expandedSize based on children_deep_count', () => {
      const nodesWithDeepCount = [
        { id: 'a', children_deep_count: 0 },
        { id: 'b', children_deep_count: 2 },
      ];
      const result = computeNodeStates({ nodes: nodesWithDeepCount, totalBudget: 30, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 2, expandedSize: 3 }, // 'b' has 2 children, so it expands to 3 (itself + 2 children)
      ]);
    });

    it('computes expandedSize when children_deep_count is not provided', () => {
      const nodesWithNoDeepCount = [
        { id: 'a' },
        {
          id: 'b',
          children: [{ id: 'b1' }, { id: 'b2' }],
        },
      ];

      const result = computeNodeStates({ nodes: nodesWithNoDeepCount, totalBudget: 30, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        { id: 'a', expandedSize: 1 },
        {
          id: 'b',
          expandedSize: 3, // 'b' has 2 children, so it expands to 3 (itself + 2 children)
          children: [{ id: 'b1' }, { id: 'b2' }],
        },
      ]);
    });

    it('handles totalBudget less than minimalSubTree', () => {
      const nodes = [
        { id: 'a', children_deep_count: 0 },
        { id: 'b', children_deep_count: 0 },
      ];

      const result = computeNodeStates({ nodes, totalBudget: 1, minimalSubTree: 3 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 1 },
        { id: 'b', children_deep_count: 0, expandedSize: 0, collapsedSize: 1 },
      ]);
    });

    it('handles all children collapsed when totalBudget is 0', () => {
      const nodes = [
        { id: 'a', children_deep_count: 0 },
        { id: 'b', children_deep_count: 0 },
      ];
      const result = computeNodeStates({ nodes, totalBudget: 0, minimalSubTree: 1 });

      expect(result).toStrictEqual([
        { id: 'a', children_deep_count: 0, expandedSize: 0, collapsedSize: 2 },
        { id: 'b', children_deep_count: 0, expandedSize: 0 },
      ]);
    });
  });
});
