'use client';

import { ChevronUpIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { useEffect, useState } from 'react';

/**
 * A button that appears after scrolling past a target element and scrolls the page back to top.
 *
 * @param {Object} props
 * @param {string|HTMLElement} [props.target] CSS selector string or HTMLElement to observe.
 */
export function GoToTopButton({ target }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let targetElement = null;

    if (typeof target === 'string') {
      targetElement = document.querySelector(target);
    } else {
      targetElement = target;
    }

    if (!targetElement) {
      console.warn('GoToTopButton: Target element not found.');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setShowButton(!entry.isIntersecting);
      });
    });

    observer.observe(targetElement);
    return () => observer.disconnect();
  }, [target]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!showButton) {
    return null;
  }

  return (
    <>
      <IconButton
        variant="invisible"
        aria-label="Retornar ao topo"
        icon={ChevronUpIcon}
        size="large"
        className="go-to-top-button"
        onClick={scrollToTop}
        tooltipDirection="nw"
      />
      <style jsx="true" global="true">{`
        .go-to-top-button {
          position: fixed;
          right: 0;
          bottom: 0;
          margin: 16px;
        }
      `}</style>
    </>
  );
}
