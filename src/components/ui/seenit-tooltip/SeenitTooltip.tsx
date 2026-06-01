import { clsx } from 'clsx';
import { FC, JSX, ReactNode } from 'react';

interface SeenitTooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const SeenitTooltip: FC<SeenitTooltipProps> = ({ label, children, className }): JSX.Element => (
  <div
    data-tag="seenit-tooltip"
    className={clsx('group/tooltip relative z-50', className)}
  >
    {children}
    <div
      role="tooltip"
      className={clsx(
        'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2',
        'rounded-md px-2.5 py-1 whitespace-nowrap',
        'light:bg-white light:text-gray-900 bg-gray-900 text-white',
        'light:ring-black/10 text-xs font-medium shadow-xl ring-1 ring-white/10',
        'opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100',
        // Arrow pointing down
        "after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:content-['']",
        'light:after:border-t-white after:border-4 after:border-transparent after:border-t-gray-900',
      )}
    >
      {label}
    </div>
  </div>
);

SeenitTooltip.displayName = 'SeenitTooltipComponent';
