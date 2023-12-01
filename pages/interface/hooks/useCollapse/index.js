import { useState } from 'react';

export default function useCollapse({
  childrenDeepCount = 0,
  childrenList,
  renderIntent = 20,
  renderIncrement = 10,
  minimalSubTree = 3,
}) {
  const [childrenState, setChildrenState] = useState(() =>
    computeStates({
      children: childrenList,
      renderIntent,
      childrenDeepCount,
      minimalSubTree,
    })
  );

  function handleExpand(id) {
    setChildrenState((lastState) => {
      const childIndex = lastState.findIndex((child) => child.id === id);
      let grouperIndex = childIndex;
      let childrenToExpand = [];

      while (lastState[grouperIndex]?.renderIntent === 0) {
        childrenToExpand.push(lastState[grouperIndex]);
        grouperIndex += 1;
      }

      return [
        ...lastState.slice(0, childIndex),
        ...computeStates({
          children: childrenToExpand,
          renderIntent: renderIncrement,
          childrenDeepCount: lastState[childIndex].groupedCount,
        }),
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

  return {
    childrenState,
    handleCollapse,
    handleExpand,
  };
}

function computeStates({ children, renderIntent, childrenDeepCount, lastState = [], minimalSubTree = 3 }) {
  if (!children?.length && childrenDeepCount === 0) return [];

  let remaining = renderIntent;
  let treeIntent = minimalSubTree;
  let grouperIndex = null;
  let groupedCount = 0;
  let deltaIndex = 0;

  const newStates = children.map((child, index) => {
    if (lastState.length > 0) {
      if (lastState[index + deltaIndex]?.id === child.id && child.id) {
        const childLastState = lastState[index + deltaIndex];
        remaining -= childLastState.renderIntent;
        if (childLastState.renderShowMore) grouperIndex = index;
        if (childLastState.renderIntent) grouperIndex = null;

        return { ...childLastState, ...child };
      }

      // in case any child has changed order
      const childLastStateIndex = lastState.findIndex((childLastState) => childLastState.id === child.id && child.id);

      if (childLastStateIndex > -1) {
        deltaIndex = childLastStateIndex - index;
        remaining -= lastState[childLastStateIndex].renderIntent;
        if (lastState[childLastStateIndex].renderShowMore) grouperIndex = index;
        if (lastState[childLastStateIndex].renderIntent) grouperIndex = null;

        return { ...lastState[childLastStateIndex], ...child };
      }
    }

    if (remaining > 0) {
      if (remaining < treeIntent) {
        treeIntent = remaining;
      }
      const renderIntent = treeIntent > child.children_deep_count ? 1 + child.children_deep_count : treeIntent;
      remaining -= renderIntent;

      return {
        ...child,
        renderIntent: renderIntent,
        groupedCount: 1 + child.children_deep_count,
        renderShowMore: false,
      };
    }

    if (grouperIndex === null) {
      grouperIndex = index;
      remaining -= 1;

      return {
        ...child,
        renderIntent: 0,
        groupedCount: 1 + child.children_deep_count,
        renderShowMore: true,
      };
    }

    groupedCount += 1 + child.children_deep_count;

    return {
      ...child,
      renderIntent: 0,
      groupedCount: 1 + child.children_deep_count,
      renderShowMore: false,
    };
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

  if (grouperIndex !== null) {
    newStates[grouperIndex].groupedCount += groupedCount;
  }

  return newStates;
}
