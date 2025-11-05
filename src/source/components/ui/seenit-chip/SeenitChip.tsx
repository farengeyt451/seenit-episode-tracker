import { clsx } from 'clsx';
import { FC, JSX, ReactNode } from 'react';

interface SeenitChipProps {
  children: ReactNode;
  className?: string;
}

export const SeenitChip: FC<SeenitChipProps> = ({ children, className }): JSX.Element => {
  return (
    <div
      data-tag="chips"
      className={clsx(
        'relative flex items-center justify-center',
        'rounded-[10px] select-none',
        'align-baseline text-xs/normal font-semibold whitespace-nowrap text-gray-200',
        'light:text-gray-900',
        className,
      )}
    >
      {children}
    </div>
  );
};

SeenitChip.displayName = 'SeenitChipComponent';
