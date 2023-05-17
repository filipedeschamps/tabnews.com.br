import { useEffect, useState } from 'react';

export default function useCollapse({
  id,
  childrenDeepCount = 0,
  childrenList,
  renderIntent = 20,
  renderIncrement = 10,
  minimalSubTree = 3,
}) {
  const [eldestChildDate, setEldestChildDate] = useState();
  const [extraChildrenList, setExtraChildrenList] = useState([]);
  const [childrenWithState, setChildrenWithState] = useState(() =>
    computeStates({
      children: [...childrenList, ...extraChildrenList],
      renderIntent,
      childrenDeepCount,
      minimalSubTree,
    })
  );

  useEffect(() => {
    const newChildrenList = [
      ...childrenList,
      ...extraChildrenList.filter((newChild) => !childrenList.some((child) => child.id === newChild.id)),
    ];

    setChildrenWithState((lastState) =>
      computeStates({ children: newChildrenList, renderIntent, childrenDeepCount, lastState, minimalSubTree })
    );

    setEldestChildDate((previousEldestChildDate) => {
      let eldestChildDate = newChildrenList.at(-1)?.published_at || previousEldestChildDate;

      newChildrenList.forEach((child) => {
        if (new Date(child.published_at) < new Date(eldestChildDate)) {
          eldestChildDate = child.published_at;
        }
      });

      return eldestChildDate;
    });
  }, [childrenDeepCount, minimalSubTree, renderIntent, childrenList, extraChildrenList]);

  async function handleExpand(id) {
    if (id !== 'needToFetch') {
      setChildrenWithState((previousState) => {
        const childIndex = previousState.findIndex((child) => child.id === id);
        let grouperIndex = childIndex;
        let childrenToExpand = [];

        while (previousState[grouperIndex]?.renderIntent === 0) {
          childrenToExpand.push(previousState[grouperIndex]);
          grouperIndex += 1;
        }

        return [
          ...previousState.slice(0, childIndex),
          ...computeStates({
            children: childrenToExpand,
            renderIntent: renderIncrement,
            childrenDeepCount: previousState[childIndex].groupedCount,
          }),
          ...previousState.slice(grouperIndex),
        ];
      });
    }

    const extraChildren = (await getMoreChildren()) || [];

    if (id === 'needToFetch') {
      setChildrenWithState((previousState) => {
        const filteredExtraChildren = extraChildren.filter(
          (newChild) => !previousState.some((child) => child.id === newChild.id)
        );
        return [
          ...previousState.slice(0, -1),
          ...computeStates({
            children: filteredExtraChildren,
            renderIntent: renderIncrement,
            childrenDeepCount: previousState.at(-1).groupedCount,
          }),
        ];
      });
    }

    setExtraChildrenList((lastExtraChildrenList) => [
      ...lastExtraChildrenList,
      ...extraChildren
        .filter((newChild) => !lastExtraChildrenList.some((child) => child.id === newChild.id))
        .filter((newChild) => !childrenList.some((child) => child.id === newChild.id)),
    ]);
  }

  async function getMoreChildren() {
    const published_before = eldestChildDate ? `&published_before=${eldestChildDate}` : '';
    const response = await fetch(`/api/v1/contents?parent_id=${id}&per_page=${renderIncrement}${published_before}`);

    if (!response.ok) return;

    return await response.json();
  }

  function handleCollapse(id) {
    setChildrenWithState((lastState) => {
      const childIndex = lastState.findIndex((child) => child.id === id);
      let children = [...lastState];

      if (childIndex < 0) return children;

      children[childIndex].renderIntent = 0;
      children[childIndex].renderShowMore = true;
      children[childIndex].hiddenAvailable = countAvailable(lastState[childIndex]);

      if (lastState[childIndex + 1]?.renderIntent === 0) {
        children[childIndex].groupedCount += lastState[childIndex + 1].groupedCount;
        children[childIndex].hiddenAvailable += lastState[childIndex + 1].hiddenAvailable;
        children[childIndex + 1].renderShowMore = false;
      }

      let groupedIndex = childIndex - 1;

      while (lastState[groupedIndex]?.renderIntent === 0) {
        if (groupedIndex === childIndex - 1) {
          children[childIndex].renderShowMore = false;
        }

        children[groupedIndex].groupedCount += children[childIndex].groupedCount;
        children[groupedIndex].hiddenAvailable += children[childIndex].hiddenAvailable;
        groupedIndex -= 1;
      }

      return children;
    });
  }

  return {
    childrenWithState,
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
  let needToFetch = childrenDeepCount;
  let hiddenAvailable = 0;

  const newStates = children.map((child, index) => {
    needToFetch -= 1 + child.children_deep_count;

    if (lastState.length > 0 && lastState[0]?.id !== 'needToFetch') {
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

    groupedCount += 1 + child.children_deep_count;
    hiddenAvailable += countAvailable(child);

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
    const grouper = newStates[grouperIndex];

    if (grouper.hiddenAvailable !== undefined) {
      grouper.hiddenAvailable += hiddenAvailable;
      grouper.groupedCount += groupedCount;
    } else {
      grouper.hiddenAvailable = hiddenAvailable;
      grouper.groupedCount = groupedCount + needToFetch;
    }
  }

  if (needToFetch > 0 && grouperIndex === null) {
    newStates.push({
      id: 'needToFetch',
      renderIntent: 0,
      groupedCount: groupedCount + needToFetch,
      renderShowMore: true,
      hiddenAvailable: hiddenAvailable,
    });
  }

  return newStates;
}

function countAvailable(child) {
  let available = 1;

  if (child.children?.length > 0) {
    child.children.forEach((subChild) => {
      available += countAvailable(subChild);
    });
  }

  return available;
}
