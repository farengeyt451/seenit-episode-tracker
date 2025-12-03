import { HeartIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { FC, JSX } from 'react';

interface SupportLinkProps {
  withBorder?: boolean;
}

export const SupportLink: FC<SupportLinkProps> = ({ withBorder = false }): JSX.Element => {
  return (
    <a
      data-tag="support__link"
      href="https://ko-fi.com/farengeyt451"
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
        'bg-indigo-900 text-white hover:bg-indigo-800',
        'light:bg-slate-600 light:hover:bg-slate-700',
        withBorder && 'light:border-slate-200/40 border border-slate-500/30',
      )}
    >
      <HeartIcon className="size-4" />
      Support on Ko-fi
    </a>
  );
};
