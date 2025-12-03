import { FC, JSX } from 'react';

interface LinearProgressProps {
  className?: string;
}

export const LinearProgress: FC<LinearProgressProps> = ({ className = '' }): JSX.Element => (
  <div
    data-tag="linear-progress"
    className={`light:bg-sky-200 w-full overflow-hidden bg-gray-800 ${className}`}
  >
    <div className="animate-indeterminate light:bg-blue-600 h-full w-full bg-blue-500" />
    <div className="animate-indeterminate-short light:bg-blue-600 absolute top-0 h-full w-full bg-blue-500" />
  </div>
);

LinearProgress.displayName = 'LinearProgress';
