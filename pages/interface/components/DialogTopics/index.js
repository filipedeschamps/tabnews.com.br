import { Box, Dialog } from '@primer/react';
import { useEffect, useRef, useState } from 'react';

import { Link } from '@/Link';

export default function DialogTopics({ returnFocusRef, isOpen, setIsOpen }) {
  const [headings, setHeadings] = useState([]);
  const observer = useRef(null);

  // hierarchy effect in dialog
  const hierarchyEffect = (tag) => (Number(tag) - 1) * 20;

  const updateHeadings = () => {
    const updatedHeadingsElements = document.querySelectorAll(
      '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6',
    );
    setHeadings(Array.from(updatedHeadingsElements));
  };

  useEffect(() => {
    updateHeadings();

    observer.current = new MutationObserver(updateHeadings);
    observer.current.observe(document.body, { subtree: true, childList: true });

    return () => {
      observer.current.disconnect();
    };
  }, []);
  return (
    <Dialog
      returnFocusRef={returnFocusRef}
      isOpen={isOpen}
      onDismiss={() => setIsOpen(false)}
      aria-labelledby="header"
      sx={{
        margin: 0,
        left: 'auto',
        right: 0,
        maxHeight: '100vh',
        height: '100vh',
        transform: 'translate(0)',
        overflow: 'auto',
        padding: 4,
        '@media screen and (max-width: 750px)': {
          maxHeight: '100vh',
        },
      }}>
      {headings.map((heading) => (
        <Box sx={{ marginLeft: hierarchyEffect(heading.tagName.charAt(1)) }} key={heading.id}>
          <Link href={`#${heading.id}`} onClick={() => setIsOpen(false)}>
            {heading.outerText}
          </Link>
        </Box>
      ))}
    </Dialog>
  );
}
