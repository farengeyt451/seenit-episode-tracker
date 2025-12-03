import { Theme } from '@/enums';
import { useThemeStore } from '@/store/useThemeStore';
import { FC, JSX } from 'react';

export const TypingTVIcon: FC = (): JSX.Element => {
  const theme = useThemeStore(state => state.theme);

  const colors =
    theme === Theme.Dark
      ? {
          frame: '#23272f',
          body: '#2b7fff',
          screen: '#1e293b',
          cursor: '#2b7fff',
          stand: '#64748b',
        }
      : {
          frame: '#64748b',
          body: '#2b7fff',
          screen: '#94a3b8',
          cursor: '#2b7fff',
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
        fill={colors.screen}
        stroke={colors.body}
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
      {/* Blinking cursor */}
      <rect
        x="60"
        y="50"
        width="4"
        height="20"
        rx="2"
        fill="#2b7fff"
      >
        <animate
          attributeName="opacity"
          values="1;0;1"
          dur="1s"
          repeatCount="indefinite"
        />
      </rect>
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

TypingTVIcon.displayName = 'SVGTypingTVIcon';
