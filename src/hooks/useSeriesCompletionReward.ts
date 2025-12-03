import { Nullable } from '@/utility-types';
import { useEffect } from 'react';
import { useReward } from 'react-rewards';

interface UseSeriesCompletionRewardProps {
  isCompleted: boolean;
  isEnded: boolean;
  activeSeriesId: Nullable<number>;
  isRewardShownMap: Record<number, boolean>;
  balloonsRewardId: string;
  confettiRewardId: string;
  setIsRewardShown: (seriesId: number) => void;
}

export const useSeriesCompletionReward = ({
  isCompleted,
  isEnded,
  activeSeriesId,
  isRewardShownMap,
  setIsRewardShown,
  balloonsRewardId,
  confettiRewardId,
}: UseSeriesCompletionRewardProps) => {
  const { reward: balloonsReward, isAnimating: isBalloonsAnimating } = useReward(balloonsRewardId, 'balloons', {
    spread: 75,
    elementCount: 10,
  });
  const { reward: confettiReward, isAnimating: isConfettiAnimating } = useReward(confettiRewardId, 'confetti', {
    spread: 45,
    elementCount: 50,
  });

  useEffect(() => {
    const shouldShowReward =
      isCompleted &&
      isEnded &&
      !isBalloonsAnimating &&
      !isConfettiAnimating &&
      activeSeriesId &&
      !isRewardShownMap?.[activeSeriesId];

    if (shouldShowReward) {
      setIsRewardShown(activeSeriesId);
      balloonsReward();
      confettiReward();
    }
  }, [
    isCompleted,
    isEnded,
    activeSeriesId,
    isRewardShownMap,
    setIsRewardShown,
    balloonsReward,
    isBalloonsAnimating,
    confettiReward,
    isConfettiAnimating,
  ]);
};
