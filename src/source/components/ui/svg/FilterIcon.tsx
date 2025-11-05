import { FC } from 'react';

export const FilterIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2 4h12M4 8h8M6 12h4"
      strokeWidth="2"
      strokeLinecap="round"
      stroke="currentColor"
    />
  </svg>
);

FilterIcon.displayName = 'FilterIcon';
