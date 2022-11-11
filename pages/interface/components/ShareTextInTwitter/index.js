import { Button } from '@primer/react';
import { FaTwitter } from 'react-icons/fa';

const styleWindow = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=650,width=800,left=20,top=150';

export default function ShareTextInTwitter({ objectContent }) {
  function textShare() {
    let urlShare = `https://twitter.com/intent/tweet?text=${objectContent.title}. Essa notícia saiu no TabNews (e você ganha TabCoins comentando lá): https://www.tabnews.com.br/${objectContent.owner_username}/${objectContent.slug}`;
    return window.open(encodeURI(urlShare), '', styleWindow);
  }

  return (
    <Button
      variant="invisible"
      aria-label="Compartilhar"
      trailingIcon={FaTwitter}
      size="small"
      onClick={() => {
        textShare();
      }}>
      Compartilhar
    </Button>
  );
}
