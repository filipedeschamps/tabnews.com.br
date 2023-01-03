import { ChevronUpIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { useEffect, useState } from 'react';

export default function GoToTopButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const header = document.querySelector('#header');
    const html = document.querySelector('html');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setShowButton(!entry.isIntersecting);

        if (!entry.isIntersecting) html.style.scrollBehavior = 'initial';
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
        onClick={() => {
          const html = document.querySelector('html');

          html.style.scrollBehavior = 'smooth';
          html.scrollTop = 0;
        }}
      />
    )
  );
}
