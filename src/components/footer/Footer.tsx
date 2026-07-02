import { GitHubIcon, LinkedInIcon } from '@/components/ui';
import clsx from 'clsx';
import { FC, JSX } from 'react';

const GITHUB_URL = 'https://github.com/farengeyt451/seenit-episode-tracker';
const LINKEDIN_URL = 'https://www.linkedin.com/in/alexander-kislov/';

export const Footer: FC = (): JSX.Element => {
  return (
    <footer
      data-tag="footer"
      className={clsx(
        'flex shrink-0 items-center justify-center gap-2 border-t-2 px-3 py-2 text-xs font-medium',
        'border-gray-700 bg-gray-900 text-gray-400',
        'light:border-slate-500/60 light:bg-slate-200 light:text-slate-500',
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

      <span
        aria-hidden="true"
        className="light:text-slate-400 text-gray-600"
      >
        ●
      </span>

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
    </footer>
  );
};

Footer.displayName = 'FooterComponent';
