import { Box } from '@primer/react';
import { TwitterShareButton, TwitterIcon, LinkedinShareButton, LinkedinIcon } from 'react-share';

export default function SharePost({ objectContent }) {
  return (
    <Box>
      <TwitterShareButton
        title={`${objectContent.title}. Essa notícia saiu no TabNews (e você ganha TabCoins comentando lá):`}
        url={`https://www.tabnews.com.br/${objectContent.owner_username}/${objectContent.slug}`}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>
      <LinkedinShareButton url={`https://www.tabnews.com.br/${objectContent.owner_username}/${objectContent.slug}`}>
        <LinkedinIcon size={32} round />
      </LinkedinShareButton>
    </Box>
  );
}
