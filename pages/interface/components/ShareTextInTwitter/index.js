import { Button } from '@primer/react';
import { FaTwitter } from 'react-icons/fa';

const styleWindow = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=650,width=800,left=20,top=150';

export default function ShareTextInTwitter({ objectContent }) {
  function textShare() {
    return window.open(
      `https://twitter.com/intent/tweet?text=${objectContent.title}.%20Essa%20not%C3%ADcia%20saiu%20no%20TabNews%20(e%20voc%C3%AA%20ganha%20TabCoins%20comentando%20l%C3%A1):%20https%3A%2F%2Fwww.tabnews.com.br%2F${objectContent.owner_username}%2F${objectContent.slug}`,
      '',
      styleWindow
    );
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
