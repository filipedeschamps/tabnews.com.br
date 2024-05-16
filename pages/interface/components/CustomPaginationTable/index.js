import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react';
import { Box } from '@primer/react';
import { get } from '@primer/react/lib-esm/constants';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button } from './Button';

const MAX_TRUNCATED_STEP_COUNT = 7;

const viewportRanges = {
  narrow: '(max-width: calc(768px - 0.02px))',
  // < 768px
  regular: '(min-width: 768px)',
  // >= 768px
  wide: '(min-width: 1400px)', // >= 1400px
};

const StyledPagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 1rem;
  width: 100%;
  grid-area: footer;
  padding: 0.5rem 1rem;
  border: 1px solid ${get('colors.border.default')};
  border-top-width: 0;
  border-end-start-radius: 6px;
  border-end-end-radius: 6px;

  .TablePaginationRange {
    color: ${get('colors.fg.muted')};
    font-size: 0.75rem;
    margin: 0;
  }

  .TablePaginationSteps {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    list-style: none;
    color: ${get('colors.fg.default')};
    font-size: 0.875rem;
    margin: 0;
    padding: 0;
  }

  .TablePaginationStep:first-of-type {
    margin-right: 1rem;
  }

  .TablePaginationStep:last-of-type {
    margin-left: 1rem;
  }

  .TablePaginationAction {
    display: flex;
    align-items: center;
    color: ${get('colors.fg.muted')};
    font-size: 0.875rem;
    line-height: calc(20 / 14);
    user-select: none;
    padding: 0.5rem;
    border-radius: 6px;

    &[data-has-page] {
      color: ${get('colors.accent.fg')};
    }

    &:hover,
    &:focus,
    .TablePaginationPage:hover,
    .TablePaginationPage:focus {
      background-color: ${get('colors.actionListItem.default.hoverBg')};
      transition-duration: 0.1s;
    }
  }

  .TablePaginationPage {
    min-width: 2rem;
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    line-height: calc(20 / 14);
    user-select: none;
    border-radius: 6px;

    &[data-active='true'] {
      background-color: ${get('colors.accent.emphasis')};
      color: ${get('colors.fg.onEmphasis')};
    }
  }

  .TablePaginationTruncationStep {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    min-height: 2rem;
    user-select: none;
  }
  ${Object.keys(viewportRanges)
    .map((viewportRangeKey) => {
      return `
  @media (${viewportRanges[viewportRangeKey]}) {
    .TablePaginationSteps[data-hidden-viewport-ranges*='${viewportRangeKey}'] > *:not(:first-child):not(:last-child) {
      display: none;
    }

    .TablePaginationSteps[data-hidden-viewport-ranges*='${viewportRangeKey}'] > *:first-child {
      margin-inline-end: 0;
    }

    .TablePaginationSteps[data-hidden-viewport-ranges*='${viewportRangeKey}'] > *:last-child {
      margin-inline-start: 0;
    }
  }
`;
    })
    .join('')}
`;

export default function CustomPaginationTable({
  'aria-label': label,
  defaultPageIndex,
  id,
  onChange,
  pageSize = 25,
  showPages = {
    narrow: false,
  },
  totalCount,
}) {
  const {
    pageIndex,
    pageStart,
    pageEnd,
    pageCount,
    hasPreviousPage,
    hasNextPage,
    selectPage,
    selectNextPage,
    selectPreviousPage,
  } = usePagination({
    defaultPageIndex,
    onChange,
    pageSize,
    totalCount,
  });
  const truncatedPageCount = pageCount > 2 ? Math.min(pageCount - 2, MAX_TRUNCATED_STEP_COUNT) : 0;
  const [offsetStartIndex, setOffsetStartIndex] = useState(() => {
    return getDefaultOffsetStartIndex(pageIndex, pageCount, truncatedPageCount);
  });
  const offsetEndIndex = offsetStartIndex + truncatedPageCount - 1;
  const hasLeadingTruncation = offsetStartIndex >= 2;
  const hasTrailingTruncation = pageCount - 1 - offsetEndIndex > 1;

  const getViewportRangesToHidePages = useCallback(() => {
    if (typeof showPages !== 'boolean') {
      return Object.keys(showPages).filter((key) => !showPages[key]);
    }
    if (showPages) {
      return [];
    } else {
      return Object.keys();
    }
  }, [showPages]);

  return (
    <>
      <StyledPagination aria-label={label} className="TablePagination" id={id}>
        <Range pageStart={pageStart} pageEnd={pageEnd} totalCount={totalCount} />
        <ol className="TablePaginationSteps" data-hidden-viewport-ranges={getViewportRangesToHidePages().join(' ')}>
          <Step>
            <Button
              className="TablePaginationAction"
              type="button"
              data-has-page={hasPreviousPage ? true : undefined}
              aria-disabled={!hasPreviousPage ? true : undefined}
              onClick={() => {
                if (!hasPreviousPage) {
                  return;
                }
                selectPreviousPage();
                if (hasLeadingTruncation) {
                  if (pageIndex - 1 < offsetStartIndex + 1) {
                    setOffsetStartIndex(offsetStartIndex - 1);
                  }
                }
              }}>
              {hasPreviousPage ? <ChevronLeftIcon /> : null}
              <span className="TablePaginationActionLabel">Anterior</span>
            </Button>
          </Step>
          {pageCount > 0 ? (
            <Step>
              <Page
                active={pageIndex === 0}
                onClick={() => {
                  selectPage(0);
                  if (pageCount > 1) {
                    setOffsetStartIndex(1);
                  }
                }}>
                1{' '}
                {hasLeadingTruncation ? (
                  <Box
                    sx={{
                      border: 0,
                      clip: 'rect(0 0 0 0)',
                      clipPath: 'inset(50%)',
                      height: '1px',
                      margin: '-1px',
                      overflow: 'hidden',
                      padding: 0,
                      position: 'absolute',
                      width: '1px',
                      whiteSpace: 'nowrap',
                      ':focus': {
                        clip: 'auto',
                        clipPath: 'none',
                        height: 'auto',
                        margin: 0,
                        overflow: 'visible',
                        position: 'static',
                        width: 'auto',
                        whiteSpace: 'normal',
                      },
                    }}>
                    &#8230;
                  </Box>
                ) : null}
              </Page>
            </Step>
          ) : null}
          {pageCount > 2
            ? Array.from({ length: truncatedPageCount }).map((_, i) => {
                if (i === 0 && hasLeadingTruncation) {
                  return <TruncationStep key={`truncation-${i}`} />;
                }
                if (i === truncatedPageCount - 1 && hasTrailingTruncation) {
                  return <TruncationStep key={`truncation-${i}`} />;
                }
                const page = offsetStartIndex + i;
                return (
                  <Step key={i}>
                    <Page
                      active={pageIndex === page}
                      onClick={() => {
                        selectPage(page);
                      }}>
                      {page + 1}
                      {i === truncatedPageCount - 2 && hasTrailingTruncation ? <div>&#8230;</div> : null}
                    </Page>
                  </Step>
                );
              })
            : null}
          {pageCount > 1 ? (
            <Step>
              <Page
                active={pageIndex === pageCount - 1}
                onClick={() => {
                  selectPage(pageCount - 1);
                  setOffsetStartIndex(pageCount - 1 - truncatedPageCount);
                }}>
                {pageCount}
              </Page>
            </Step>
          ) : null}
          <Step>
            <Button
              className="TablePaginationAction"
              type="button"
              data-has-page={hasNextPage ? true : undefined}
              aria-disabled={!hasNextPage ? true : undefined}
              onClick={() => {
                if (!hasNextPage) {
                  return;
                }
                selectNextPage();
                if (hasTrailingTruncation) {
                  if (pageIndex + 1 > offsetEndIndex - 1) {
                    setOffsetStartIndex(offsetStartIndex + 1);
                  }
                }
              }}>
              <span className="TablePaginationActionLabel">Próximo</span>
              {hasNextPage ? <ChevronRightIcon /> : null}
            </Button>
          </Step>
        </ol>
      </StyledPagination>
    </>
  );
}

CustomPaginationTable.displayName = 'Pagination';

function getDefaultOffsetStartIndex(pageIndex, pageCount, truncatedPageCount) {
  // When the current page is closer to the end of the list than the beginning
  if (pageIndex > pageCount - 1 - pageIndex) {
    if (pageCount - 1 - pageIndex >= truncatedPageCount) {
      return pageIndex - 3;
    }
    return pageCount - 1 - truncatedPageCount;
  }

  // When the current page is closer to the beginning of the list than the end
  if (pageIndex < pageCount - 1 - pageIndex) {
    if (pageIndex >= truncatedPageCount) {
      return pageIndex - 3;
    }
    return 1;
  }

  // When the current page is the midpoint between the beginning and the end
  if (pageIndex < truncatedPageCount) {
    return pageIndex;
  }
  return pageIndex - 3;
}

function Range({ pageStart, pageEnd, totalCount }) {
  const start = pageStart + 1;
  const end = pageEnd === totalCount - 1 ? totalCount : pageEnd;

  return (
    <>
      <p className="TablePaginationRange">
        {start}
        <span aria-hidden>&#8212;</span>
        {end} de {totalCount}
      </p>
    </>
  );
}

function TruncationStep() {
  return (
    <li aria-hidden className="TablePaginationTruncationStep">
      &#8230;
    </li>
  );
}

TruncationStep.displayName = 'TruncationStep';

function Step({ children }) {
  return <li className="TablePaginationStep">{children}</li>;
}

Step.displayName = 'Step';

function Page({ active, children, onClick }) {
  return (
    <Button
      className="TablePaginationPage"
      type="button"
      data-active={active ? true : undefined}
      aria-current={active ? true : undefined}
      onClick={onClick}>
      {children}
    </Button>
  );
}

Page.displayName = 'Page';

function usePagination(config) {
  const { defaultPageIndex, onChange, pageSize, totalCount } = config;
  const pageCount = Math.ceil(totalCount / pageSize);
  const [pageIndex, setPageIndex] = useState(() => {
    if (defaultPageIndex !== undefined) {
      if (defaultPageIndex >= 0 && defaultPageIndex < pageCount) {
        return defaultPageIndex;
      }
    }
    return 0;
  });

  const pageStart = pageIndex * pageSize;
  const pageEnd = Math.min(pageIndex * pageSize + pageSize, totalCount - 1);
  const hasNextPage = pageIndex + 1 < pageCount;
  const hasPreviousPage = pageIndex > 0;

  function selectPage(newPageIndex) {
    if (pageIndex !== newPageIndex) {
      setPageIndex(newPageIndex);
      onChange?.({ pageIndex: newPageIndex });
    }
  }

  function selectPreviousPage() {
    if (hasPreviousPage) {
      selectPage(pageIndex - 1);
    }
  }

  function selectNextPage() {
    if (hasNextPage) {
      selectPage(pageIndex + 1);
    }
  }

  return {
    pageIndex,
    pageStart,
    pageEnd,
    pageCount,
    hasNextPage,
    hasPreviousPage,
    selectPage,
    selectPreviousPage,
    selectNextPage,
  };
}
