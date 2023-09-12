import { useRouter } from 'next/router';
import { useRevalidate } from 'next-swr';
import { useEffect, useState } from 'react';
import { useReward } from 'react-rewards';

import { Box, IconButton, Text, Tooltip } from '@/TabNewsUI';
import { ChevronDownIcon, ChevronUpIcon } from '@/TabNewsUI/icons';
import { useUser } from 'pages/interface';

export default function TabCoinButtons({ content }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useUser();

  const [contentObject, setContentObject] = useRevalidate(content);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    setContentObject(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.id]);

  const { reward: rewardCredit, isAnimating: isAnimatingCredit } = useReward(`reward-${contentObject.id}`, 'confetti', {
    position: 'absolute',
    lifetime: 100,
    decay: 0.9,
    spread: 60,
    elementCount: 100,
  });

  const { reward: rewardDebit, isAnimating: isAnimatingDebit } = useReward(`reward-${contentObject.id}`, 'emoji', {
    position: 'absolute',
    lifetime: 100,
    angle: 90,
    startVelocity: 10,
    decay: 0.94,
    spread: 60,
    elementCount: 4,
    emoji: ['😡'],
  });

  async function transactTabCoin(transactionType) {
    setIsPosting(true);

    if (!user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
      return;
    }

    try {
      const response = await fetch(`/api/v1/contents/${contentObject.owner_username}/${contentObject.slug}/tabcoins`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_type: transactionType,
        }),
      });

      const responseBody = await response.json();

      if (response.status === 201) {
        fetchUser();
        setContentObject({ ...contentObject, ...responseBody });
        setIsPosting(false);
        if (transactionType === 'credit') {
          rewardCredit();
        }

        if (transactionType === 'debit') {
          rewardDebit();
        }
        return;
      }

      alert(`${responseBody.message} ${responseBody.action}`);
      setIsPosting(false);
    } catch (error) {
      setIsPosting(false);
    }
  }

  const isInAction = isPosting || isAnimatingCredit || isAnimatingDebit;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: contentObject.title ? '9px' : '0px',
      }}>
      <Tooltip aria-label="Achei relevante" direction="ne">
        <IconButton
          variant="invisible"
          aria-label="Creditar TabCoin"
          icon={ChevronUpIcon}
          size="small"
          sx={{ color: 'fg.subtle', lineHeight: '18px' }}
          onClick={() => transactTabCoin('credit')}
          disabled={isInAction}
        />
      </Tooltip>
      <Box>
        <div id={`reward-${contentObject.id}`} style={{ marginLeft: '-10px', width: '1px' }}></div>
        <Text
          sx={{
            fontSize: 0,
            fontWeight: 'bold',
            color: 'accent.emphasis',
          }}>
          {contentObject.tabcoins}
        </Text>
      </Box>
      <Tooltip aria-label="Não achei relevante" direction="ne">
        <IconButton
          variant="invisible"
          aria-label="Debitar TabCoin"
          icon={ChevronDownIcon}
          size="small"
          sx={{ color: 'fg.subtle', lineHeight: '18px' }}
          onClick={() => transactTabCoin('debit')}
          disabled={isInAction}
        />
      </Tooltip>
    </Box>
  );
}
