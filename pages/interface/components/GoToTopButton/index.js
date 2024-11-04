import { useEffect, useState } from 'react';

import { IconButton } from '@/TabNewsUI';
import { ChevronUpIcon } from '@/TabNewsUI/icons';

export default function GoToTopButton() {
  const [showButton, setShowButton] = useState(false);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const header = document.querySelector('#header');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setShowButton(!entry.isIntersecting);
      });
    });

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    showButton && (
      <IconButton
        variant="invisible"
        aria-label="Retornar ao topo"
        icon={ChevronUpIcon}
        size="large"
        sx={{ color: 'fg.subtle', lineHeight: '18px' }}
        onClick={handleScrollToTop}
        tooltipDirection="nw"
      />
    )
  );
}
