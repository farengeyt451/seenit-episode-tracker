import { SeenItCheckbox } from '@/components/ui';
import { TrackingSeason } from '@/types';
import { FC, useMemo } from 'react';

interface EpisodesGridProps {
  season: TrackingSeason;
}

export const EpisodesGrid: FC<EpisodesGridProps> = ({ season }) => {
  const episodes = useMemo(() => Object.values(season.episodes), [season.episodes]);

  return (
    <div
      data-tag="episodes-grid"
      className="grid grid-cols-8 gap-3"
    >
      {episodes.map(({ id, number, isWatched }) => {
        return (
          <SeenItCheckbox
            key={id}
            episodeId={id}
            checked={isWatched}
            episodeNumber={number}
          />
        );
      })}
    </div>
  );
};

EpisodesGrid.displayName = 'EpisodesGridComponent';
