import { useSeriesStore } from '@/store';
import { Input } from '@headlessui/react';
import { clsx } from 'clsx';
import { FC, HTMLProps, JSX } from 'react';
import { useShallow } from 'zustand/shallow';

interface SeenItCheckboxProps extends HTMLProps<HTMLInputElement> {
  episodeId: string;
  episodeNumber: number;
}

export const SeenItCheckbox: FC<SeenItCheckboxProps> = ({ checked, episodeId, episodeNumber }): JSX.Element => {
  const { toggleEpisodeWatched } = useSeriesStore(
    useShallow(state => ({
      toggleEpisodeWatched: state.toggleEpisodeWatched,
    })),
  );

  const handleChange = (episodeId: string) => {
    const [seriesId, seasonId] = episodeId.split(':');

    toggleEpisodeWatched({ seriesId, seasonId, episodeId, isWatched: !checked });
  };

  return (
    <div
      data-tag="seenit-checkbox"
      className="group/box rounded-lg"
    >
      <label className="flex cursor-pointer flex-col items-center">
        <div className="relative mb-2">
          <Input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={() => handleChange(episodeId)}
          />
          <div
            className={clsx(
              `flex size-6 items-center justify-center`,
              'rounded border-2',
              'transition-colors duration-200',
              'light:group-hover/box:border-blue-500 group-hover/box:border-gray-300',
              checked ? 'light:border-sky-500 border-gray-300' : 'light:border-slate-400 border-gray-400',
            )}
          >
            <div
              className={clsx(
                `size-4 rounded bg-green-500`,
                'transform transition-all duration-250',
                checked ? 'scale-100' : 'scale-0',
              )}
            ></div>
          </div>
        </div>
        <span
          className={clsx(
            'text-sm',
            'light:group-hover/box:text-blue-800 group-hover/box:text-gray-200',
            'transition-colors duration-200 ease-in',
            checked ? 'light:text-slate-900 text-gray-200' : 'light:text-slate-600 text-gray-300/70',
          )}
        >
          Ep {episodeNumber}
        </span>
      </label>
    </div>
  );
};

SeenItCheckbox.displayName = 'SeenItCheckboxComponent';
