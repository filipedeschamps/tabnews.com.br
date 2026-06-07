'use client';

import { UnderlineNav as PrimerUnderlineNav } from '@primer/react';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';

import classes from './UnderlineNav.module.css';

const ITEMS_SUFFIX = ' items';

export function UnderlineNav({ className, ...props }) {
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    function localizeOverflowButton() {
      const moreButton = nav.querySelector('button[aria-expanded]');
      if (!moreButton) return;

      const walker = document.createTreeWalker(moreButton, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        if (text.trim() === 'More') {
          node.nodeValue = 'Mais';
        } else if (text.endsWith(ITEMS_SUFFIX)) {
          node.nodeValue = text.slice(0, -ITEMS_SUFFIX.length);
        }
      }
    }

    localizeOverflowButton();

    const observer = new MutationObserver(localizeOverflowButton);
    observer.observe(nav, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return <PrimerUnderlineNav ref={navRef} className={clsx(classes.UnderlineNav, className)} {...props} />;
}

UnderlineNav.Item = PrimerUnderlineNav.Item;
