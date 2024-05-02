import { ListUnorderedIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { useEffect, useRef, useState } from 'react';

export default function OpenDialogTopicsButton({ setIsOpen }) {
  const [headings, setHeadings] = useState([]);
  const observer = useRef(null);

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
    headings.length > 0 && (
      <IconButton
        variant="invisible"
        aria-label="Retornar ao topo"
        icon={ListUnorderedIcon}
        size="large"
        sx={{ color: 'fg.subtle', lineHeight: '18px' }}
        onClick={() => setIsOpen(true)}
      />
    )
  );
}
