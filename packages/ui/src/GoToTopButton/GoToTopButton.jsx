'use client';

import { ChevronUpIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

import classes from './GoToTopButton.module.css';

/**
 * A button that appears after scrolling past a target element and scrolls the page back to top.
 *
 * @param {Object} props
 * @param {string|HTMLElement} [props.target] CSS selector string or HTMLElement to observe.
 * @param {string} [props.className] Additional class names to merge with the button's own styles.
 */
export function GoToTopButton({ target, className }) {
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
    <IconButton
      variant="invisible"
      aria-label="Retornar ao topo"
      icon={ChevronUpIcon}
      size="large"
      className={clsx(classes.Button, className)}
      onClick={scrollToTop}
      tooltipDirection="nw"
    />
  );
}
