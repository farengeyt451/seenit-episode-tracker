import { SupportLink } from '@/components/ui';
import { CheckCircleIcon, LockOpenIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { FC, JSX } from 'react';

interface SupportBlockProps {
  isActivated?: boolean;
  successMessage?: string;
}

export const SupportBlock: FC<SupportBlockProps> = ({ isActivated = false, successMessage }): JSX.Element => {
  if (isActivated) {
    return (
      <div
        data-tag="support-activated"
        className={clsx(
          'rounded-lg border p-4',
          'border-green-500/30 bg-green-500/10 text-green-200',
          'light:border-green-200 light:bg-green-50 light:text-green-900',
          'animate-in fade-in slide-in-from-top-4 duration-500',
          'shadow-lg shadow-green-500/20',
        )}
      >
        <div
          className={clsx(
            'text-md mb-2 flex items-center gap-2 font-medium',
            'animate-in zoom-in delay-200 duration-700',
          )}
        >
          <CheckCircleIcon className={clsx('size-4', 'animate-in spin-in-180 delay-300 duration-700')} />
          <span>All Features Unlocked!</span>
        </div>
        <p
          className={clsx(
            'mb-3 text-[0.75rem] opacity-90',
            'animate-in fade-in slide-in-from-left-2 delay-400 duration-500',
          )}
        >
          Thank you for your support. You now have full access to dark theme, data backup & restore, and favorites
          tracking.
        </p>
        {successMessage && (
          <p
            className={clsx(
              'light:bg-green-100 rounded-lg bg-green-900/20 p-2 text-xs',
              'animate-in fade-in zoom-in-95 delay-500 duration-500',
            )}
          >
            {successMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      data-tag="support"
      className={clsx(
        'rounded-lg p-4 font-semibold',
        'bg-blue-500/10 text-slate-200',
        'light:bg-indigo-500 light:text-slate-100',
      )}
    >
      <div
        data-tag="support__info"
        className="text-md mb-1 flex items-center gap-2 font-medium"
      >
        <LockOpenIcon className="size-4" />
        <span>Support to Unlock Additional Features</span>
      </div>
      <p
        data-tag="support__details"
        className="mb-3 text-[0.75rem] opacity-90"
      >
        Access dark theme, data backup, and favorites tracking.
      </p>
      <SupportLink withBorder={true} />
    </div>
  );
};
