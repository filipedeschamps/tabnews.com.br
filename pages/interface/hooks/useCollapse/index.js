import { useEffect, useMemo, useState } from 'react';

export default function useCollapse({ childrenList, renderIntent = 20, renderIncrement = 10, flatten = false }) {
  const flattenedTree = useMemo(flattenTree, [childrenList, flatten]);
  const [childrenState, setChildrenState] = useState(() => computeStates(flattenedTree, renderIntent));

  useEffect(() => {
    setChildrenState((lastState) => computeStates(flattenedTree, renderIntent, lastState));
  }, [flattenedTree, renderIntent]);

  const filteredTree = useMemo(() => {
    let merged = [];

    flattenedTree.forEach((child, index) => {
      if (!child.id) return;
      if (child.id !== childrenState[index]?.id) return;
      if (child.renderIntent < 1 && !child.renderShowMore) return;
      merged.push({ ...childrenState[index], ...child });
    });

    return merged;
  }, [childrenState, flattenedTree]);

  function computeStates(children, renderIntent, lastState = []) {
    let newStates = [];
    let remaining = renderIntent;
    let grouperIndex = null;
    let deltaIndex = 0;

    children.forEach((child, index) => {
      if (lastState.length > 0) {
        if (lastState[index + deltaIndex]?.id === child.id && child.id) {
          newStates.push(lastState[index + deltaIndex]);
          remaining -= lastState[index + deltaIndex].renderIntent;
          return;
        }

        const childLastStateIndex = lastState.findIndex((childLastState) => childLastState.id === child.id && child.id);

        if (childLastStateIndex > -1) {
          deltaIndex = childLastStateIndex - index;
          newStates.push(lastState[childLastStateIndex]);
          remaining -= lastState[childLastStateIndex].renderIntent;
          return;
        }
      }

      if (remaining > 0) {
        newStates.push({
          id: child.id,
          renderIntent: 1,
          groupedCount: 1 + child.children_deep_count,
          renderShowMore: false,
        });
      }

      if (remaining === 0) {
        grouperIndex = index;

        newStates.push({
          id: child.id,
          renderIntent: 0,
          groupedCount: 1 + child.children_deep_count,
          renderShowMore: true,
        });
      }

      if (remaining < 0) {
        if (newStates[grouperIndex]) {
          newStates[grouperIndex].groupedCount += 1 + child.children_deep_count;
        }

        newStates.push({
          id: child.id,
          renderIntent: 0,
          groupedCount: 1 + child.children_deep_count,
          renderShowMore: false,
        });
      }

      remaining -= 1;
    });

    for (const child of newStates) {
      if (remaining < 1) break;

      if (child.groupedCount - child.renderIntent > remaining) {
        child.renderIntent += remaining;
        remaining = 0;
      } else {
        remaining -= child.groupedCount - child.renderIntent;
        child.renderIntent = child.groupedCount;
      }
    }

    return newStates;
  }

  function handleExpand(id) {
    setChildrenState((lastState) => {
      const childIndex = lastState.findIndex((child) => child.id === id);
      let grouperIndex = childIndex;
      let childrenToExpand = [];

      while (lastState[grouperIndex]?.renderIntent === 0) {
        childrenToExpand.push(flattenedTree[grouperIndex]);
        grouperIndex += 1;
      }

      return [
        ...lastState.slice(0, childIndex),
        ...computeStates(childrenToExpand, renderIncrement),
        ...lastState.slice(grouperIndex),
      ];
    });
  }

  function handleCollapse(id) {
    setChildrenState((lastState) => {
      const childIndex = lastState.findIndex((child) => child.id === id);
      let children = [...lastState];

      if (childIndex < 0) return children;

      children[childIndex].renderIntent = 0;
      children[childIndex].renderShowMore = true;

      if (lastState[childIndex + 1]?.renderIntent === 0) {
        children[childIndex].groupedCount += lastState[childIndex + 1].groupedCount;
        children[childIndex + 1].renderShowMore = false;
      }

      let groupedIndex = childIndex - 1;

      while (lastState[groupedIndex]?.renderIntent === 0) {
        if (groupedIndex === childIndex - 1) {
          children[childIndex].renderShowMore = false;
        }

        children[groupedIndex].groupedCount += children[childIndex].groupedCount;
        groupedIndex -= 1;
      }

      return children;
    });
  }

  function flattenTree() {
    if (!flatten) return childrenList;
    if (!childrenList.length > 0) return [];

    let flattenTree = [...childrenList];

    while (flattenTree.at(-1)?.children?.length === 1) {
      flattenTree = [
        ...flattenTree.slice(0, -1),
        { ...flattenTree.at(-1), children: [], children_deep_count: 0 },
        ...flattenTree.at(-1).children,
      ];
    }

    return flattenTree;
  }

  return {
    filteredTree,
    handleCollapse,
    handleExpand,
  };
}
