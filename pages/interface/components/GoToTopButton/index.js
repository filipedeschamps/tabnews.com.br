import { ChevronUpIcon } from '@primer/octicons-react';
import { IconButton } from '@primer/react';
import { useEffect, useState } from 'react';

export default function GoToTopButton() {
  const [showButton, setShowButton] = useState(false);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    // Antes era verificado se o header estava ainda em tela para mostrar o botão
    // Para que funcione com o header dinamico foi modificado para verificar se o usuário
    // Rolou a página, caso tenha mostre o botão, caso contrario não mostre
    const handleScroll = () => {
      setShowButton(window.scrollY > 0);
    }

    window.addEventListener('scroll', handleScroll);
    
    // Remove o listener quando o componente for desmontado
    return () => window.removeEventListener('scroll', handleScroll);
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
      />
    )
  );
}
