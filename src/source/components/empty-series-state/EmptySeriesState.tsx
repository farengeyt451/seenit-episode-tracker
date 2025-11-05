import { SeenItButton, WelcomeTVIcon } from '@/components/ui';
import { useSidebarStore } from '@/store';
import clsx from 'clsx';
import { FC, JSX } from 'react';

export const EmptySeriesState: FC = (): JSX.Element => {
  const setSidebarOpenState = useSidebarStore(state => state.setSidebarOpenState);

  return (
    <div
      data-tag="empty-series"
      className="cursor-default text-center"
    >
      <div
        data-tag="empty-series__icon"
        className="flex justify-center"
      >
        <WelcomeTVIcon />
      </div>

      <p
        data-tag="empty-series__message"
        className={clsx('light:text-slate-600 mt-6 max-w-xs text-base font-medium text-gray-300')}
      >
        You have not added any series yet. <br /> Let’s add a new one and start tracking!
      </p>

      <div
        data-tag="empty-series__action"
        className="mt-4"
      >
        <SeenItButton
          colorType="primary"
          onClick={() => setSidebarOpenState(true)}
        >
          <span>Find Series</span>
        </SeenItButton>
      </div>
    </div>
  );
};

EmptySeriesState.displayName = 'EmptySeriesStateComponent';
