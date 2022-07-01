import { useState, useEffect } from 'react';
import { Box, Text, IconButton } from '@primer/react';
import { ChevronUpIcon, ChevronDownIcon } from '@primer/octicons-react';
import { useReward } from 'react-rewards';
import { useRouter } from 'next/router';

import { useUser } from 'pages/interface/index.js';

export default function TabCoinButtons({ content }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useUser();

  const [contentObject, setContentObject] = useState(content);
  const [isPosting, setIsPosting] = useState(false);

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
      const response = await fetch(`/api/v1/contents/${contentObject.username}/${contentObject.slug}/tabcoins`, {
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: contentObject.title ? '12px' : '2px',
      }}>
      <Box>
        <IconButton
          variant="invisible"
          aria-label="Search"
          icon={ChevronUpIcon}
          size="small"
          sx={{ color: 'fg.subtle' }}
          onClick={() => {
            transactTabCoin('credit');
          }}
          disabled={isPosting || isAnimatingCredit || isAnimatingDebit}
        />
      </Box>
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
      <Box>
        <IconButton
          variant="invisible"
          aria-label="Search"
          icon={ChevronDownIcon}
          size="small"
          sx={{ color: 'fg.subtle' }}
          onClick={() => {
            transactTabCoin('debit');
          }}
          disabled={isPosting || isAnimatingCredit || isAnimatingDebit}
        />
      </Box>
    </Box>
  );
}
