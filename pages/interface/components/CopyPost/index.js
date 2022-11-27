import { useState } from 'react';
import { Box, Button } from '@primer/react';
import { FiCopy } from 'react-icons/fi';

export default function CopyPost({ objectContent }) {
  const [msgCopy, setMsgCopy] = useState('Copiar');
  const msgToCopy = `${objectContent.title}. Essa notícia saiu no TabNews (e você ganha TabCoins comentando lá): https://www.tabnews.com.br/${objectContent.owner_username}/${objectContent.slug}`;

  function copyPost() {
    navigator.clipboard.writeText(msgToCopy);
    setMsgCopy('Post copiado com sucesso');
    setTimeout(() => setMsgCopy('Copiar'), 4000);
  }

  return (
    <Box>
      {objectContent.title !== null && (
        <Button variant="invisible" leadingIcon={FiCopy} size="small" onClick={copyPost}>
          {msgCopy}
        </Button>
      )}
    </Box>
  );
}
