import { Theme } from '@/enums';
import { useThemeStore } from '@/store/useThemeStore';
import { FC, JSX } from 'react';

export const EmptyTVIcon: FC = (): JSX.Element => {
  const theme = useThemeStore(state => state.theme);

  const colors =
    theme === Theme.Dark
      ? {
          frame: '#4f46e5',
          body: '#23272f',
          screen: '#1e293b',
          face: '#64748b',
          stand: '#64748b',
        }
      : {
          frame: '#4f46e5',
          body: '#94a3b8',
          screen: '#94a3b8',
          face: '#334155',
          stand: '#64748b',
        };

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      className="seenit-animated-info-block"
      aria-hidden="true"
    >
      <rect
        x="15"
        y="30"
        width="90"
        height="60"
        rx="10"
        fill={colors.body}
        stroke={colors.frame}
        strokeWidth="3"
      />
      <rect
        x="25"
        y="40"
        width="70"
        height="40"
        rx="6"
        fill={colors.screen}
      />
      {/* Sad face */}
      <circle
        cx="60"
        cy="60"
        r="14"
        fill={colors.screen}
      />
      <circle
        cx="55"
        cy="58"
        r="2"
        fill={colors.face}
      />
      <circle
        cx="65"
        cy="58"
        r="2"
        fill={colors.face}
      />
      <path
        d="M55 66 Q60 62 65 66"
        stroke={colors.face}
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="35"
        y="95"
        width="50"
        height="6"
        rx="3"
        fill={colors.stand}
      />
    </svg>
  );
};

EmptyTVIcon.displayName = 'SVGEmptyTVIcon';
