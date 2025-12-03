import { Theme } from '@/enums';
import { useThemeStore } from '@/store/useThemeStore';
import { FC, JSX } from 'react';

export const ErrorTVIcon: FC = (): JSX.Element => {
  const theme = useThemeStore(state => state.theme);

  const colors =
    theme === Theme.Dark
      ? {
          frame: '#23272f',
          screen: '#1e293b',
          stand: '#64748b',
        }
      : {
          frame: '#e2e8f0',
          screen: '#e2e8f0',
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
        fill={colors.frame}
        stroke="#ef4444"
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
      <rect
        x="40"
        y="55"
        width="40"
        height="10"
        rx="3"
        fill="#334155"
      />
      {/* Red X */}
      <line
        x1="45"
        y1="45"
        x2="75"
        y2="75"
        stroke="#ef4444"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="45"
        x2="45"
        y2="75"
        stroke="#ef4444"
        strokeWidth="5"
        strokeLinecap="round"
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

ErrorTVIcon.displayName = 'SVGErrorTVIcon';
