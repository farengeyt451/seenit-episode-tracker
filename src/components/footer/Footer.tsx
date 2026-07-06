import { GitHubIcon, LinkedInIcon } from '@/components/ui';
import { useSettingsStore } from '@/store';
import { XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { FC, JSX } from 'react';

const GITHUB_URL = 'https://github.com/farengeyt451/seenit-episode-tracker';
const LINKEDIN_URL = 'https://www.linkedin.com/in/alexander-kislov/';

export const Footer: FC = (): JSX.Element => {
  const setFooterVisible = useSettingsStore(state => state.setFooterVisible);

  return (
    <footer
      data-tag="footer"
      className={clsx(
        'relative flex shrink-0 items-center justify-center gap-2 border-t px-3 py-2.5 text-xs font-medium',
        'border-gray-700 bg-gray-900 text-gray-400',
        'light:border-slate-500/60 light:bg-slate-200 light:text-slate-700',
      )}
    >
      <a
        data-tag="footer__link-github"
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star Seenit! on GitHub"
        className={clsx(
          'group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
          'underline-offset-4 hover:text-gray-100',
          'light:hover:text-slate-900',
        )}
      >
        <GitHubIcon className="size-4 transition-transform duration-300 group-hover:scale-110" />
        <span>Star on GitHub</span>
      </a>

      <a
        data-tag="footer__link-linkedin"
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Connect with me on LinkedIn"
        className={clsx(
          'group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
          'underline-offset-4 hover:text-gray-100',
          'light:hover:text-slate-900',
        )}
      >
        <LinkedInIcon className="size-4 text-sky-500 transition-transform duration-300 group-hover:scale-110" />
        <span>Connect on LinkedIn</span>
      </a>

      <button
        type="button"
        data-tag="footer__close"
        onClick={() => setFooterVisible(false)}
        aria-label="Hide footer"
        className={clsx(
          'group absolute top-1/2 right-3 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-1 transition-colors',
          'hover:bg-gray-700/60 hover:text-gray-100',
          'light:hover:text-slate-900 light:hover:bg-slate-300',
        )}
      >
        <XMarkIcon className="size-4" />
      </button>
    </footer>
  );
};

Footer.displayName = 'FooterComponent';
