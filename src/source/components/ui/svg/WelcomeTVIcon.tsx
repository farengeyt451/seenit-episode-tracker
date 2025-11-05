import { Theme } from '@/enums';
import { useThemeStore } from '@/store/useTheme';
import { FC } from 'react';

export const WelcomeTVIcon: FC = () => {
  const theme = useThemeStore(state => state.theme);

  const colors =
    theme === Theme.Dark
      ? {
          frame: '#23272f',
          body: '#155dfc',
          screen: '#1e293b',
          play: '#155dfc',
          stand: '#64748b',
        }
      : {
          frame: '#94a3b8',
          body: '#3b82f6',
          screen: '#94a3b8',
          play: '#2563eb',
          stand: '#64748b',
        };

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className="seenit-animated-tv-glow"
    >
      {/* TV body */}
      <rect
        x="15"
        y="30"
        width="90"
        height="60"
        rx="10"
        fill={colors.frame}
        stroke={colors.body}
        strokeWidth="3"
      />
      {/* TV screen */}
      <rect
        x="25"
        y="40"
        width="70"
        height="40"
        rx="6"
        fill={colors.screen}
      />
      {/* Play button */}
      <circle
        cx="60"
        cy="60"
        r="14"
        fill={colors.play}
      />
      <polygon
        points="65,60 57,55 57,65"
        fill="#fff"
      />
      {/* TV stand */}
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

WelcomeTVIcon.displayName = 'SVGWelcomeTVIcon';
