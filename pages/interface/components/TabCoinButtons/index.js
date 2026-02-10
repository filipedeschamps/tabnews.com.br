import { useRouter } from 'next/router';
import { useRevalidate } from 'next-swr';
import { useEffect, useState } from 'react';
import { useReward } from 'react-rewards';

import { Box, IconButton, TabCoinBalanceTooltip, Tooltip } from '@/TabNewsUI';
import { ChevronDownIcon, ChevronUpIcon } from '@/TabNewsUI/icons';
import { createErrorMessage, useUser } from 'pages/interface';

export default function TabCoinButtons({ content }) {
  if (content?.status !== 'published') {
    return <DisabledButtons />;
  }

  return <ActiveButtons content={content} />;
}

function ActiveButtons({ content }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useUser();

  const [contentObject, setContentObject] = useRevalidate(content);
  const [isPosting, setIsPosting] = useState(false);
  const [voteChange, setVoteChange] = useState(0);

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
    if (!user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
      return;
    }

    setIsPosting(true);
    const change = transactionType === 'credit' ? 1 : -1;
    setVoteChange(change);

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
        setVoteChange(0);

        if (transactionType === 'credit') {
          rewardCredit();
        }

        if (transactionType === 'debit') {
          rewardDebit();
        }
        return;
      }

      alert(
        createErrorMessage(responseBody, {
          omitErrorId: response.status == 422,
        }),
      );

      setIsPosting(false);
      setVoteChange(0);
    } catch (error) {
      setIsPosting(false);
      setVoteChange(0);
    }
  }

  const isInAction = isPosting || isAnimatingCredit || isAnimatingDebit;

  const upColor = voteChange > 0 || isAnimatingCredit ? 'success.emphasis' : 'fg.subtle';
  const downColor = voteChange < 0 || isAnimatingDebit ? 'danger.emphasis' : 'fg.subtle';
  const countColor =
    voteChange > 0 || isAnimatingCredit
      ? 'success.emphasis'
      : voteChange < 0 || isAnimatingDebit
        ? 'danger.emphasis'
        : 'accent.emphasis';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
      <Tooltip text="Achei relevante" direction="ne">
        <IconButton
          variant="invisible"
          aria-label="Creditar TabCoin"
          icon={ChevronUpIcon}
          size="small"
          sx={{ color: upColor, lineHeight: '18px' }}
          onClick={() => transactTabCoin('credit')}
          disabled={isInAction}
        />
      </Tooltip>
      <TabCoinBalanceTooltip
        direction="ne"
        sx={{
          width: '100%',
          textAlign: 'center',
          fontSize: 0,
          fontWeight: 'bold',
          my: 2,
          py: 1,
          color: countColor,
        }}
        credit={contentObject.tabcoins_credit + (voteChange > 0 ? 1 : 0)}
        debit={contentObject.tabcoins_debit + (voteChange < 0 ? -1 : 0)}>
        <div id={`reward-${contentObject.id}`} style={{ marginLeft: '-10px' }} aria-hidden></div>
        {contentObject.tabcoins + voteChange}
      </TabCoinBalanceTooltip>
      <Tooltip text="Não achei relevante" direction="ne">
        <IconButton
          variant="invisible"
          aria-label="Debitar TabCoin"
          icon={ChevronDownIcon}
          size="small"
          sx={{ color: downColor, lineHeight: '18px', mb: 2 }}
          onClick={() => transactTabCoin('debit')}
          disabled={isInAction}
        />
      </Tooltip>
    </Box>
  );
}

function DisabledButtons() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', color: 'border.muted', mt: 1, gap: 4, mb: 2 }}>
      <ChevronUpIcon />
      <ChevronDownIcon />
    </Box>
  );
}
